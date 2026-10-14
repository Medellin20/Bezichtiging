'use client';

import { usePathname } from 'next/navigation';
import { Home, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const navigation = ['Appartementen', 'Hoe werkt het', 'Over ons', 'FAQ'];
const legal = ['Juridische kennisgeving', 'Privacy', 'Algemene voorwaarden'];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname?.startsWith('/admin/')) return null;

  return (
    <footer className="bg-[#091417] text-[#F6F3EC] text-sm leading-relaxed">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-5 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:pb-14 lg:pt-8">
        <div>
          <div className="inline-flex items-center gap-2 font-bold text-lg text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Home className="h-6 w-6" aria-hidden="true" />
            </span>
            Real Estate NL
          </div>
          <p className="mt-4 max-w-[280px]">
            Uw betrouwbare agentschap voor het huren van appartementen in Nederland — van de zoektocht tot de verhuizing.
          </p>
          <div className="mt-5 flex gap-3" aria-label="Sociale media">
            {[{ icon: Facebook, name: 'Facebook' }, { icon: Instagram, name: 'Instagram' }, { icon: Linkedin, name: 'LinkedIn' }].map(({ icon: Icon, name }) => (
              <span key={name} aria-label={name} role="img" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>

        <nav aria-label="Footernavigatie">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]">Navigatie</h2>
          <ul className="space-y-3">
            <li><span>Home</span></li>
            {navigation.slice(0, 3).map((label) => <li key={label}><span>{label}</span></li>)}
            <li><span>Contact</span></li>
            <li><span>{navigation[3]}</span></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]">Juridische informatie</h2>
          <ul className="space-y-3">
            {legal.map((label) => <li key={label}><span>{label}</span></li>)}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em]">Contact</h2>
          <address className="space-y-3 not-italic">
            <p className="flex items-start gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-all">contacts@realestatenl.agency</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              +31649496257
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-xs sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong className="font-semibold">NL Real Estate B.V.</strong> · Makelaardij · opgericht in 2006 · Gustav Mahlerplein 64, Unit A, 1082 MA Amsterdam</span>
          </p>
          <p className="lg:shrink-0">KvK 34253699 · Kluisnummer NL02139484</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Real Estate NL. Alle rechten voorbehouden.</p>
          <p>Appartementen huren in Nederland</p>
        </div>
      </div>
    </footer>
  );
}
