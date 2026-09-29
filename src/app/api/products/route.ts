import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const edition = searchParams.get('edition');
    const feature = searchParams.get('feature');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where: any = { active: true };

    if (type && type !== 'All') {
      where.type = type;
    }

    if (edition && edition !== 'All') {
      where.edition = edition;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (feature) {
      if (feature === 'Hypixel') where.isHypixelReady = true;
      if (feature === 'NameChange') where.hasNameChange = true;
      if (feature === 'SkinChange') where.hasSkinChange = true;
      if (feature === 'Cape') where.hasCape = true;
      if (feature === 'EmailAccess') where.hasEmailAccess = true;
      if (feature === 'Microsoft') where.isMicrosoftAccount = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') orderBy = { price: 'asc' };
    else if (sort === 'price-high') orderBy = { price: 'desc' };
    else if (sort === 'popular') orderBy = { reviewCount: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'recommended') orderBy = { rating: 'desc' };

    const products = await db.product.findMany({
      where,
      orderBy,
    });

    const parsedProducts = products.map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]'),
      includedFeatures: JSON.parse(p.includedFeatures || '[]'),
      excludedFeatures: JSON.parse(p.excludedFeatures || '[]'),
      capes: JSON.parse(p.capes || '[]'),
    }));

    return NextResponse.json({ products: parsedProducts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
