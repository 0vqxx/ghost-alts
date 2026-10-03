import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { productId, credentialsList } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const credentials = Array.isArray(credentialsList)
      ? credentialsList.filter((cred: unknown): cred is string =>
          typeof cred === 'string' && Boolean(cred.trim()) && !cred.includes('@ghostvault.internal')
        ).map((cred: string) => cred.trim())
      : [];

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: 'Add real account credentials before making stock available.' },
        { status: 400 }
      );
    }

    const createdItems = [];
    for (const credential of credentials) {
      const created = await db.inventoryItem.create({
        data: {
          productId: product.id,
          sensitiveCredentialsMasked: credential,
          status: 'AVAILABLE',
        },
      });
      createdItems.push(created);
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
      added: credentials.length,
      currentStock: totalAvail,
      items: createdItems.map((item) => ({
        ...item,
        product: { name: product.name, type: product.type, edition: product.edition },
      })),
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
