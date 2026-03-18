'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function addProduct(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const benefits = formData.get('benefits') as string;

  if (!name || !description || !benefits) {
    return { error: 'All fields are required.' };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, description, benefits }]);

  if (error) {
    console.error('Error inserting product:', error);
    return { error: 'Failed to add product. Please try again.' };
  }

  revalidatePath('/products');
  return { success: true };
}
