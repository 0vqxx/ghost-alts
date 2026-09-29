import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { productId, count, credentialsList } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let addedCount = 0;

    if (Array.isArray(credentialsList) && credentialsList.length > 0) {
      // Admin provided actual account credentials / combos
      for (const cred of credentialsList) {
        const cleanCred = (cred || '').trim();
        if (cleanCred) {
          await db.inventoryItem.create({
            data: {
              productId: product.id,
              sensitiveCredentialsMasked: cleanCred,
              status: 'AVAILABLE',
            },
          });
          addedCount++;
        }
      }
    } else {
      // Auto-generated synthetic secure keys
      const itemsToAdd = Math.min(100, Math.max(1, parseInt(count) || 5));
      for (let i = 0; i < itemsToAdd; i++) {
        await db.inventoryItem.create({
          data: {
            productId: product.id,
            sensitiveCredentialsMasked: `GA-${product.type}-${Math.random().toString(36).substring(2, 8).toUpperCase()}:${Math.random().toString(36).substring(2, 10)}@ghostvault.internal`,
            status: 'AVAILABLE',
          },
        });
        addedCount++;
      }
    }

    // Update product stock count
    const totalAvail = await db.inventoryItem.count({
      where: { productId: product.id, status: 'AVAILABLE' },
    });

    await db.product.update({
      where: { id: product.id },
      data: { stockCount: totalAvail },
    });

    return NextResponse.json({
      success: true,
      added: addedCount,
      currentStock: totalAvail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inventory item ID required' }, { status: 400 });
    }

    const item = await db.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await db.inventoryItem.delete({ where: { id } });

    // Update product stock count
    const totalAvail = await db.inventoryItem.count({
      where: { productId: item.productId, status: 'AVAILABLE' },
    });

    await db.product.update({
      where: { id: item.productId },
      data: { stockCount: totalAvail },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
