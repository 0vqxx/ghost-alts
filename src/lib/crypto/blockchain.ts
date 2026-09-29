export interface PaymentCheckResult {
  status: 'awaiting_payment' | 'detected' | 'confirming' | 'paid' | 'underpaid';
  txHash: string | null;
  amountReceived: number;
  confirmations: number;
  explorerUrl?: string;
}

const SATOSHI_PER_COIN = 100_000_000;

export async function checkAddressPayment(
  symbol: 'BTC' | 'LTC',
  receivingAddress: string,
  expectedAmount: number,
  orderCreatedTimestamp: number,
  minConfirmations: number = 1
): Promise<PaymentCheckResult> {
  const sym = symbol.toUpperCase() as 'BTC' | 'LTC';
  const cleanAddress = receivingAddress.trim();

  if (!cleanAddress) {
    return {
      status: 'awaiting_payment',
      txHash: null,
      amountReceived: 0,
      confirmations: 0,
    };
  }

  try {
    if (sym === 'BTC') {
      return await checkBitcoinPayment(cleanAddress, expectedAmount, orderCreatedTimestamp, minConfirmations);
    } else {
      return await checkLitecoinPayment(cleanAddress, expectedAmount, orderCreatedTimestamp, minConfirmations);
    }
  } catch (err) {
    console.error(`[BlockchainCheck] Error checking ${sym} for address ${cleanAddress}:`, err);
    return {
      status: 'awaiting_payment',
      txHash: null,
      amountReceived: 0,
      confirmations: 0,
    };
  }
}

/**
 * Check Bitcoin transactions using Mempool.space / Blockstream Esplora APIs
 */
async function checkBitcoinPayment(
  address: string,
  expectedAmount: number,
  orderCreatedTimestamp: number,
  minConfirmations: number
): Promise<PaymentCheckResult> {
  const apiEndpoints = [
    `https://mempool.space/api`,
    `https://blockstream.info/api`,
  ];

  let txs: any[] | null = null;
  let tipHeight = 0;

  for (const base of apiEndpoints) {
    try {
      const res = await fetch(`${base}/address/${address}/txs`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        txs = await res.json();
        // Get tip height for accurate confirmation count
        try {
          const tipRes = await fetch(`${base}/blocks/tip/height`, {
            signal: AbortSignal.timeout(3000),
          });
          if (tipRes.ok) {
            tipHeight = parseInt(await tipRes.text(), 10) || 0;
          }
        } catch {}
        break;
      }
    } catch (e) {
      console.warn(`[BTC] Failed fetching from ${base}:`, e);
    }
  }

  if (!txs || !Array.isArray(txs) || txs.length === 0) {
    return {
      status: 'awaiting_payment',
      txHash: null,
      amountReceived: 0,
      confirmations: 0,
    };
  }

  // Grace buffer: 5 minutes prior to order creation in case of slight clock difference
  const minTimeSec = Math.floor((orderCreatedTimestamp - 300_000) / 1000);

  // Look for incoming transactions matching this address
  for (const tx of txs) {
    const isUnconfirmed = !tx.status?.confirmed;
    const blockTime = tx.status?.block_time;

    // Skip transactions confirmed before order was created
    if (!isUnconfirmed && blockTime && blockTime < minTimeSec) {
      continue;
    }

    // Sum amount sent to our receiving address in this tx
    let satoshisToAddress = 0;
    if (Array.isArray(tx.vout)) {
      for (const output of tx.vout) {
        if (
          output.scriptpubkey_address &&
          output.scriptpubkey_address.toLowerCase() === address.toLowerCase()
        ) {
          satoshisToAddress += output.value || 0;
        }
      }
    }

    if (satoshisToAddress > 0) {
      const btcReceived = parseFloat((satoshisToAddress / SATOSHI_PER_COIN).toFixed(8));
      
      // Calculate confirmations
      let confirmations = 0;
      if (tx.status?.confirmed) {
        if (tipHeight > 0 && tx.status.block_height) {
          confirmations = Math.max(1, tipHeight - tx.status.block_height + 1);
        } else {
          confirmations = 1;
        }
      }

      // Check if amount satisfies expected (with 1% micro-drift tolerance)
      const isFullAmount = btcReceived >= expectedAmount * 0.99;

      if (!isFullAmount) {
        return {
          status: 'underpaid',
          txHash: tx.txid,
          amountReceived: btcReceived,
          confirmations,
          explorerUrl: `https://mempool.space/tx/${tx.txid}`,
        };
      }

      if (confirmations >= minConfirmations) {
        return {
          status: 'paid',
          txHash: tx.txid,
          amountReceived: btcReceived,
          confirmations,
          explorerUrl: `https://mempool.space/tx/${tx.txid}`,
        };
      } else if (confirmations > 0) {
        return {
          status: 'confirming',
          txHash: tx.txid,
          amountReceived: btcReceived,
          confirmations,
          explorerUrl: `https://mempool.space/tx/${tx.txid}`,
        };
      } else {
        return {
          status: 'detected',
          txHash: tx.txid,
          amountReceived: btcReceived,
          confirmations: 0,
          explorerUrl: `https://mempool.space/tx/${tx.txid}`,
        };
      }
    }
  }

  return {
    status: 'awaiting_payment',
    txHash: null,
    amountReceived: 0,
    confirmations: 0,
  };
}

/**
 * Check Litecoin transactions using Litecoinspace / BlockCypher APIs
 */
async function checkLitecoinPayment(
  address: string,
  expectedAmount: number,
  orderCreatedTimestamp: number,
  minConfirmations: number
): Promise<PaymentCheckResult> {
  // 1. Try Litecoinspace (Esplora API)
  try {
    const res = await fetch(`https://litecoinspace.org/api/address/${address}/txs`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const txs = await res.json();
      let tipHeight = 0;
      try {
        const tipRes = await fetch(`https://litecoinspace.org/api/blocks/tip/height`, {
          signal: AbortSignal.timeout(3000),
        });
        if (tipRes.ok) {
          tipHeight = parseInt(await tipRes.text(), 10) || 0;
        }
      } catch {}

      if (Array.isArray(txs) && txs.length > 0) {
        const minTimeSec = Math.floor((orderCreatedTimestamp - 300_000) / 1000);

        for (const tx of txs) {
          const isUnconfirmed = !tx.status?.confirmed;
          const blockTime = tx.status?.block_time;

          if (!isUnconfirmed && blockTime && blockTime < minTimeSec) {
            continue;
          }

          let litosheesToAddress = 0;
          if (Array.isArray(tx.vout)) {
            for (const output of tx.vout) {
              if (
                output.scriptpubkey_address &&
                output.scriptpubkey_address.toLowerCase() === address.toLowerCase()
              ) {
                litosheesToAddress += output.value || 0;
              }
            }
          }

          if (litosheesToAddress > 0) {
            const ltcReceived = parseFloat((litosheesToAddress / SATOSHI_PER_COIN).toFixed(8));
            let confirmations = 0;
            if (tx.status?.confirmed) {
              if (tipHeight > 0 && tx.status.block_height) {
                confirmations = Math.max(1, tipHeight - tx.status.block_height + 1);
              } else {
                confirmations = 1;
              }
            }

            const isFullAmount = ltcReceived >= expectedAmount * 0.99;

            if (!isFullAmount) {
              return {
                status: 'underpaid',
                txHash: tx.txid,
                amountReceived: ltcReceived,
                confirmations,
                explorerUrl: `https://litecoinspace.org/tx/${tx.txid}`,
              };
            }

            if (confirmations >= minConfirmations) {
              return {
                status: 'paid',
                txHash: tx.txid,
                amountReceived: ltcReceived,
                confirmations,
                explorerUrl: `https://litecoinspace.org/tx/${tx.txid}`,
              };
            } else if (confirmations > 0) {
              return {
                status: 'confirming',
                txHash: tx.txid,
                amountReceived: ltcReceived,
                confirmations,
                explorerUrl: `https://litecoinspace.org/tx/${tx.txid}`,
              };
            } else {
              return {
                status: 'detected',
                txHash: tx.txid,
                amountReceived: ltcReceived,
                confirmations: 0,
                explorerUrl: `https://litecoinspace.org/tx/${tx.txid}`,
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[LTC] Litecoinspace check failed:', err);
  }

  // 2. Fallback to BlockCypher API
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full?limit=10`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const txs = data.txs || [];
      const minTime = new Date(orderCreatedTimestamp - 300_000);

      for (const tx of txs) {
        const receivedTime = new Date(tx.received || tx.confirmed || Date.now());
        if (receivedTime < minTime) continue;

        let satoshis = 0;
        for (const out of tx.outputs || []) {
          if (
            out.addresses &&
            out.addresses.some((a: string) => a.toLowerCase() === address.toLowerCase())
          ) {
            satoshis += out.value || 0;
          }
        }

        if (satoshis > 0) {
          const ltcReceived = parseFloat((satoshis / SATOSHI_PER_COIN).toFixed(8));
          const confirmations = tx.confirmations || 0;
          const isFullAmount = ltcReceived >= expectedAmount * 0.99;

          if (!isFullAmount) {
            return {
              status: 'underpaid',
              txHash: tx.hash,
              amountReceived: ltcReceived,
              confirmations,
              explorerUrl: `https://litecoinspace.org/tx/${tx.hash}`,
            };
          }

          if (confirmations >= minConfirmations) {
            return {
              status: 'paid',
              txHash: tx.hash,
              amountReceived: ltcReceived,
              confirmations,
              explorerUrl: `https://litecoinspace.org/tx/${tx.hash}`,
            };
          } else if (confirmations > 0) {
            return {
              status: 'confirming',
              txHash: tx.hash,
              amountReceived: ltcReceived,
              confirmations,
              explorerUrl: `https://litecoinspace.org/tx/${tx.hash}`,
            };
          } else {
            return {
              status: 'detected',
              txHash: tx.hash,
              amountReceived: ltcReceived,
              confirmations: 0,
              explorerUrl: `https://litecoinspace.org/tx/${tx.hash}`,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[LTC] BlockCypher fallback check failed:', err);
  }

  return {
    status: 'awaiting_payment',
    txHash: null,
    amountReceived: 0,
    confirmations: 0,
  };
}
