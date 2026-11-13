import { redirect } from 'next/navigation';

export default function SizesRedirectPage() {
  redirect('/profile?tab=sizes');
}
