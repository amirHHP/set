'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  createdAt: string;
}

function toProductData(prod: any): ProductData {
  return {
    id: prod.id,
    name: prod.name,
    description: prod.description,
    price: prod.price,
    image: prod.image,
    category: prod.category,
    createdAt: prod.createdAt.toISOString(),
  };
}

export async function getProducts(category?: string): Promise<{ success: boolean; products?: ProductData[]; error?: string }> {
  try {
    const whereClause = category ? { category } : {};
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, products: products.map(toProductData) };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'خطا در بارگذاری محصولات.' };
  }
}

export async function addProductAction(data: { name: string; description: string; price: number; image: string; category: string }): Promise<{ success: boolean; product?: ProductData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز. فقط ادمین مجاز است.' };
    }

    if (!data.name || !data.description || !data.price || !data.image || !data.category) {
      return { success: false, error: 'تمام فیلدها الزامی هستند.' };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        image: data.image,
        category: data.category,
      }
    });

    return { success: true, product: toProductData(product) };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error: 'خطا در افزودن محصول.' };
  }
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'دسترسی غیرمجاز.' };
    }

    await prisma.product.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'خطا در حذف محصول.' };
  }
}
