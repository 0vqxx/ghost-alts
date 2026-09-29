export type AccountType = 'MCFA' | 'NFA' | string;
export type MinecraftEdition = 'Java' | 'Bedrock' | 'Java + Bedrock' | string;

export interface ProductFeature {
  label: string;
  value: string;
  included: boolean;
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  type: AccountType;
  edition: MinecraftEdition;
  price: number;
  compareAtPrice?: number | null;
  description: string;
  beforeYouBuy: string;
  features: string[];
  includedFeatures: string[];
  excludedFeatures: string[];
  isHypixelReady: boolean;
  hasNameChange: boolean;
  hasSkinChange: boolean;
  hasEmailAccess: boolean;
  hasCape: boolean;
  isMicrosoftAccount: boolean;
  region: string;
  deliveryType: string;
  rating: number;
  reviewCount: number;
  stockCount: number;
  badge?: string | null;
  blurName?: boolean;
  active: boolean;

  // Minecraft specific stats & gamemodes
  skinUsername: string;
  capes: string[];
  rank?: string | null;
  hypixelLevel?: number | null;
  // BEDWARS
  bedwarsStars?: number | null;
  bedwarsFKDR?: number | null;
  bedwarsWins?: number | null;
  bedwarsFinals?: number | null;
  // SKYWARS
  skywarsLevel?: number | null;
  skywarsKDR?: number | null;
  skywarsWins?: number | null;
  skywarsKills?: number | null;
  // DUELS
  duelsTitle?: string | null;
  duelsWins?: number | null;
  duelsWLR?: number | null;
  duelsStreak?: number | null;
  // SKYBLOCK
  skyblockNetworth?: string | null;
  skyblockSkillAvg?: number | string | null;
  skyblockCata?: number | string | null;
  skyblockCoins?: string | null;
  // DONUTSMP
  donutMoney?: string | null;
  donutRank?: string | null;
  donutPlaytime?: string | null;
  donutKills?: number | null;
  donutDeaths?: number | null;

  creationYear?: number | null;
  emailDomain?: string | null;
  banStatus?: string | null;
  hypixelBanned?: boolean;
  donutBanned?: boolean;
  acceptedCryptos?: string[];
  createdAt?: string | Date;
}

export interface CryptoSettingItem {
  id: string;
  symbol: 'BTC' | 'LTC' | string;
  address: string;
  enabled: boolean;
  minConfirmations: number;
  updatedAt?: string | Date;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN' | string;
  discordId?: string;
  discordAvatar?: string;
  avatar?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId?: string | null;
  email: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  discountCode?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED' | string;
  paymentMethod: string;
  cryptoCurrency?: string | null;
  cryptoAmountExpected?: number | null;
  cryptoAmountReceived?: number | null;
  receivingAddress?: string | null;
  txHash?: string | null;
  confirmations?: number | null;
  paymentStatus?: string | null;
  expiresAt?: string | Date | null;
  paidAt?: string | Date | null;
  exchangeRate?: number | null;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    productType: AccountType;
    edition: string;
    price: number;
    quantity: number;
  }[];
  deliveries?: {
    id: string;
    inventoryItemId: string;
    deliveredAt: string;
    revealedAt?: string | null;
    credentialsMasked?: string;
  }[];
}

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  userId: string;
  orderId?: string | null;
  category: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
  updatedAt: string;
  messages?: {
    id: string;
    senderName: string;
    senderRole: string;
    message: string;
    createdAt: string;
  }[];
}

export interface ReviewItem {
  id: string;
  productId: string;
  productName?: string;
  productType?: string;
  userId: string;
  username: string;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  isDemo: boolean;
  createdAt: string;
}
