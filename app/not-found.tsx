import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <p className="font-semibold text-primary">RealEstate · 404</p>
        <h1 className="text-3xl font-bold">Pagina niet gevonden</h1>
        <p className="text-muted-foreground">Deze pagina bestaat niet of is verplaatst.</p>
        <Link href="/" className={buttonVariants()}>Terug naar het formulier</Link>
      </div>
    </main>
  );
}
