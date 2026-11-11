'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Home,
  Calendar,
  Wallet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Landmark,
  CreditCard,
  Copy,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  Euro,
  Clock,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { formatEuro, paymentInstructionsLabel } from '@/lib/dutch-display';
import { databaseErrorMessage } from '@/lib/database-errors';
import type { PaymentSettings } from '@/lib/types';

const formSchema = z.object({
  first_name: z.string().min(1, "Voornaam is verplicht"),
  last_name: z.string().min(1, "Achternaam is verplicht"),
  birth_date: z.string().optional(),
  email: z.string().email("Ongeldig e-mailadres"),
  phone: z.string().min(10, "Ongeldig telefoonnummer"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  housing_type: z.string().optional(),
  housing_address: z.string().optional(),
  housing_reference: z.string().optional(),
  housing_link: z.string().optional(),
  preferred_date: z.string().min(1, "Kies een datum"),
  preferred_time: z.string().min(1, "Kies een tijdvak"),
  visit_type: z.string().min(1, "Kies een type bezichtiging"),
  monthly_income: z.string().optional(),
  employment_situation: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 0, title: "Persoonlijke gegevens", icon: User },
  { id: 1, title: "Contactgegevens", icon: Mail },
  { id: 2, title: "Woning", icon: Home },
  { id: 3, title: "Voorkeuren voor bezichtiging", icon: Calendar },
  { id: 4, title: "Huurprofiel", icon: Briefcase },
  { id: 5, title: "Betaling", icon: Wallet },
];

export default function VisitRequestForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const { toast } = useToast();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = methods;
  const housingLink = watch('housing_link');
  const safeHousingLink = (() => {
    if (!housingLink) return null;
    try {
      const parsed = new URL(housingLink);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const propertyLink = new URLSearchParams(window.location.search).get('property_url');
    if (propertyLink) setValue('housing_link', propertyLink, { shouldValidate: true });
  }, [setValue]);

  const fetchPaymentSettings = async () => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({
        title: "Fout",
        description: "De betalingsgegevens kunnen niet worden opgehaald",
        variant: 'destructive',
      });
      return;
    }
    if (data) setPaymentSettings(data as PaymentSettings);
  };

  const stepFields: Record<number, (keyof FormData)[]> = {
    0: ['first_name', 'last_name', 'birth_date'],
    1: ['email', 'phone', 'address', 'city', 'postal_code'],
    2: ['housing_type', 'housing_address', 'housing_reference', 'housing_link'],
    3: ['preferred_date', 'preferred_time', 'visit_type'],
    4: ['monthly_income', 'employment_situation', 'message'],
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep] || [];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep === 4) {
        await fetchPaymentSettings();
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const newRequestId = crypto.randomUUID();
      const insertData = {
        id: newRequestId,
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date || null,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        housing_type: data.housing_type || null,
        housing_address: data.housing_address || null,
        housing_reference: data.housing_reference || null,
        housing_link: data.housing_link || null,
        preferred_date: data.preferred_date || null,
        preferred_time: data.preferred_time || null,
        visit_type: data.visit_type || null,
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
        employment_situation: data.employment_situation || null,
        message: data.message || null,
      };

      // Public users can insert requests but cannot read private records.
      const { error } = await supabase
        .from('visit_requests')
        .insert(insertData);

      if (error) throw error;

      setRequestId(newRequestId);

      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-visit-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ requestId: newRequestId }),
        });
      } catch {
        // notification is best-effort
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: "Fout",
        description: databaseErrorMessage(error, "Er is een fout opgetreden bij het versturen. Uw aanvraag kon niet worden opgeslagen."),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    toast({
      title: "Gekopieerd",
      description: `${label} gekopieerd`,
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full animate-scale-in border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-9 h-9 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Aanvraag succesvol verstuurd</CardTitle>
            <CardDescription className="text-base mt-2">
              Uw aanvraag voor een bezichtiging is opgeslagen. Rond uw aanvraag af door de onderstaande bezichtigingskosten te betalen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            {paymentSettings && (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Bezichtigingskosten</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatEuro(paymentSettings.visit_fee)}
                  </p>
                </div>

                {paymentSettings.show_rib !== false && (paymentSettings.rib_iban || paymentSettings.rib_holder) && (
                  <div className="rounded-xl border bg-primary/5 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Landmark className="w-5 h-5" />
                      <span>Bankoverschrijving</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {paymentSettings.rib_holder && (
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-muted-foreground">Rekeninghouder</span>
                          <span className="font-medium">{paymentSettings.rib_holder}</span>
                        </div>
                      )}
                      {paymentSettings.rib_bank_name && (
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-muted-foreground">Bank</span>
                          <span className="font-medium">{paymentSettings.rib_bank_name}</span>
                        </div>
                      )}
                      {paymentSettings.rib_iban && (
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-muted-foreground">IBAN</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-medium break-all min-w-0">{paymentSettings.rib_iban}</span>
                            <button
                              aria-label="IBAN kopiëren"
                              onClick={() => copyToClipboard(paymentSettings.rib_iban!, 'IBAN')}
                              className="text-primary hover:text-secondary transition-colors"
                              type="button"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentSettings.rib_bic && (
                        <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-muted-foreground">BIC</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-medium break-all min-w-0">{paymentSettings.rib_bic}</span>
                            <button
                              aria-label="BIC kopiëren"
                              onClick={() => copyToClipboard(paymentSettings.rib_bic!, 'BIC')}
                              className="text-primary hover:text-secondary transition-colors"
                              type="button"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentSettings.show_payment_link !== false && paymentSettings.payment_link && (
                  <a
                    href={paymentSettings.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button size="lg" className="w-full text-base h-14">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Nu online betalen
                    </Button>
                  </a>
                )}

                {paymentSettings.payment_instructions && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">{paymentInstructionsLabel(paymentSettings.payment_instructions)}</p>
                  </div>
                )}
              </>
            )}

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStep(0);
                methods.reset();
              }}
            >
              Nieuwe aanvraag indienen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">RealEstate</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Bezichtiging aanvragen
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            Plan uw bezichtiging in Nederland met RealEstate. Vul het onderstaande formulier in.
          </p>
        </div>

        {/* Progress bar: equal columns and a fixed icon row keep every step aligned. */}
        <nav className="mb-6 sm:mb-8" aria-label="Voortgang van uw aanvraag">
          <ol className="grid grid-cols-6 items-start">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <li
                  key={step.id}
                  aria-current={isActive ? 'step' : undefined}
                  className="relative flex min-w-0 flex-col items-center"
                >
                  {idx < STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`absolute top-[18px] left-1/2 h-0.5 w-full md:top-6 ${
                        isCompleted ? 'bg-secondary' : 'bg-border'
                      }`}
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 md:h-12 md:w-12 ${
                      isActive
                        ? 'bg-primary text-white shadow-md ring-4 ring-primary/10'
                        : isCompleted
                        ? 'bg-secondary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </div>
                  <span
                    className={`sr-only md:not-sr-only md:mt-3 md:block md:w-full md:px-1 text-center text-xs leading-5 break-normal [overflow-wrap:normal] hyphens-none ${
                      isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-center text-sm leading-6 text-primary md:hidden" aria-live="polite" aria-atomic="true">
            <span className="block text-xs text-muted-foreground">Stap {currentStep + 1} van {STEPS.length}</span>
            <span className="font-semibold">{STEPS[currentStep].title}</span>
          </p>
        </nav>

        {/* Form Card */}
        <Card className="border-0 shadow-xl animate-slide-up">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="p-6 sm:p-8">
                {safeHousingLink && (
                  <div className="mb-7 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-primary">U vraagt een bezichtiging aan voor deze woning</p>
                    <a href={safeHousingLink} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-sm underline underline-offset-4 hover:text-primary">
                      {safeHousingLink}
                    </a>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => copyToClipboard(safeHousingLink, 'De woninglink')}>
                        <Copy className="w-4 h-4" /> Kopieer woninglink
                      </Button>
                      <Button asChild type="button" variant="outline" size="sm" className="gap-2">
                        <a href={safeHousingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" /> Bekijk de woning
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 0: Informations personnelles */}
                {currentStep === 0 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Persoonlijke gegevens</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Voornaam <span className="text-destructive">*</span></Label>
                        <Input id="first_name" placeholder="Jan" {...register('first_name')} />
                        {errors.first_name && (
                          <p className="text-sm text-destructive">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Achternaam <span className="text-destructive">*</span></Label>
                        <Input id="last_name" placeholder="de Vries" {...register('last_name')} />
                        {errors.last_name && (
                          <p className="text-sm text-destructive">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Geboortedatum</Label>
                      <Input id="birth_date" type="date" {...register('birth_date')} />
                    </div>
                  </div>
                )}

                {/* Step 1: Coordonnees */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Contactgegevens</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mailadres <span className="text-destructive">*</span></Label>
                        <Input id="email" type="email" placeholder="jan.devries@example.nl" {...register('email')} />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefoonnummer <span className="text-destructive">*</span></Label>
                        <Input id="phone" type="tel" placeholder="06 1234 5678" {...register('phone')} />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <Label htmlFor="address">Adres</Label>
                      <Input id="address" placeholder="Keizersgracht 12" {...register('address')} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Woonplaats</Label>
                        <Input id="city" placeholder="Amsterdam" {...register('city')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postcode</Label>
                        <Input id="postal_code" placeholder="1015 CN" {...register('postal_code')} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Logement concerne */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Woning</h2>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="housing_type">Woningtype</Label>
                      <Select defaultValue={watch('housing_type')}>
                        <SelectTrigger id="housing_type">
                          <SelectValue placeholder="Kies een woningtype" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appartement">Appartement</SelectItem>
                          <SelectItem value="maison">Huis</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="loft">Loft</SelectItem>
                          <SelectItem value="autre">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="housing_address">Adres van de woning</Label>
                      <Input id="housing_address" placeholder="Prinsengracht 15, Amsterdam" {...register('housing_address')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="housing_reference">Woningreferentie</Label>
                      <Input id="housing_reference" placeholder="REF-2026-001" {...register('housing_reference')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="housing_link">Link van de woning</Label>
                      <Input id="housing_link" type="url" placeholder="https://..." readOnly={!!safeHousingLink} {...register('housing_link')} />
                      <p className="text-xs text-muted-foreground">U kunt de advertentie bovenaan deze stap bekijken of kopiëren.</p>
                    </div>
                  </div>
                )}

                {/* Step 3: Preferences de visite */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Voorkeuren voor bezichtiging</h2>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferred_date">Gewenste datum <span className="text-destructive">*</span></Label>
                      <Input id="preferred_date" type="date" {...register('preferred_date')} />
                      {errors.preferred_date && (
                        <p className="text-sm text-destructive">{errors.preferred_date.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Gewenst tijdvak <span className="text-destructive">*</span></Label>
                      <RadioGroup
                        defaultValue={watch('preferred_time')}
                        onValueChange={(v) => methods.setValue('preferred_time', v, { shouldValidate: true })}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { value: 'matin', label: "Ochtend", desc: "09:00 - 12:00", icon: Clock },
                            { value: 'apres-midi', label: "Middag", desc: "14:00 - 17:00", icon: Clock },
                            { value: 'soir', label: "Avond", desc: "17:00 - 19:00", icon: Clock },
                          ].map((slot) => {
                            const Icon = slot.icon;
                            return (
                              <Label
                                key={slot.value}
                                htmlFor={`time-${slot.value}`}
                                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-primary/5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                              >
                                <RadioGroupItem value={slot.value} id={`time-${slot.value}`} />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{slot.label}</span>
                                  <span className="text-xs text-muted-foreground">{slot.desc}</span>
                                </div>
                                <Icon className="w-4 h-4 text-muted-foreground ml-auto" />
                              </Label>
                            );
                          })}
                        </div>
                      </RadioGroup>
                      {errors.preferred_time && (
                        <p className="text-sm text-destructive">{errors.preferred_time.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Type bezichtiging <span className="text-destructive">*</span></Label>
                      <RadioGroup
                        defaultValue={watch('visit_type')}
                        onValueChange={(v) => methods.setValue('visit_type', v, { shouldValidate: true })}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Label
                            htmlFor="visit-physique"
                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-primary/5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <RadioGroupItem value="physique" id="visit-physique" />
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Op locatie</span>
                          </Label>
                          <Label
                            htmlFor="visit-virtuelle"
                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-primary/5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          >
                            <RadioGroupItem value="virtuelle" id="visit-virtuelle" />
                            <Home className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Virtuele bezichtiging</span>
                          </Label>
                        </div>
                      </RadioGroup>
                      {errors.visit_type && (
                        <p className="text-sm text-destructive">{errors.visit_type.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Projet de location */}
                {currentStep === 4 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Huurprofiel</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthly_income">Netto maandinkomen (EUR)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="monthly_income" type="number" placeholder="2500" className="pl-9" {...register('monthly_income')} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employment_situation">Werksituatie</Label>
                        <Select defaultValue={watch('employment_situation')}>
                          <SelectTrigger id="employment_situation">
                            <SelectValue placeholder="Maak een keuze" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cdi">Vast contract</SelectItem>
                            <SelectItem value="cdd">Tijdelijk contract</SelectItem>
                            <SelectItem value="interim">Uitzendwerk</SelectItem>
                            <SelectItem value="independant">Zelfstandige / zzp&apos;er</SelectItem>
                            <SelectItem value="fonctionnaire">Ambtenaar</SelectItem>
                            <SelectItem value="etudiant">Student</SelectItem>
                            <SelectItem value="retraite">Gepensioneerd</SelectItem>
                            <SelectItem value="sans-emploi">Werkzoekend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Aanvullend bericht</Label>
                      <Textarea
                        id="message"
                        placeholder="Voeg aanvullende informatie toe voor uw bezichtigingsaanvraag..."
                        rows={4}
                        {...register('message')}
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Paiement */}
                {currentStep === 5 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Bezichtigingskosten betalen</h2>
                    </div>

                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
                      <div className="flex items-start gap-3">
                        <Wallet className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-primary">Bezichtigingskosten</p>
                          <p className="text-sm text-primary mt-1">
                            Betaal de bezichtigingskosten om uw aanvraag af te ronden. Uw aanvraag wordt na ontvangst van de betaling behandeld.
                          </p>
                        </div>
                      </div>
                    </div>

                    {paymentSettings && (
                      <>
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-1">Te betalen bedrag</p>
                          <p className="text-4xl font-bold text-primary">
                            {formatEuro(paymentSettings.visit_fee)}
                          </p>
                        </div>

                        {paymentSettings.show_payment_link !== false && paymentSettings.payment_link && (
                          <a
                            href={paymentSettings.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button type="button" size="lg" className="w-full text-base h-14">
                              <CreditCard className="w-5 h-5 mr-2" />
                              Online betalen
                            </Button>
                          </a>
                        )}

                        {paymentSettings.show_rib !== false && (paymentSettings.rib_iban || paymentSettings.rib_holder) && (
                          <div className="rounded-xl border bg-white p-5 space-y-3">
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                              <Landmark className="w-5 h-5" />
                              <span>Bankoverschrijving</span>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                              {paymentSettings.rib_holder && (
                                <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                                  <span className="text-muted-foreground">Rekeninghouder</span>
                                  <span className="font-medium">{paymentSettings.rib_holder}</span>
                                </div>
                              )}
                              {paymentSettings.rib_bank_name && (
                                <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center">
                                  <span className="text-muted-foreground">Bank</span>
                                  <span className="font-medium">{paymentSettings.rib_bank_name}</span>
                                </div>
                              )}
                              {paymentSettings.rib_iban && (
                                <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <span className="text-muted-foreground">IBAN</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-medium break-all min-w-0">{paymentSettings.rib_iban}</span>
                                    <button
                                      aria-label="IBAN kopiëren"
                              onClick={() => copyToClipboard(paymentSettings.rib_iban!, 'IBAN')}
                                      className="text-primary hover:text-primary/80 transition-colors"
                                      type="button"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              {paymentSettings.rib_bic && (
                                <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <span className="text-muted-foreground">BIC</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-medium break-all min-w-0">{paymentSettings.rib_bic}</span>
                                    <button
                                      aria-label="BIC kopiëren"
                              onClick={() => copyToClipboard(paymentSettings.rib_bic!, 'BIC')}
                                      className="text-primary hover:text-primary/80 transition-colors"
                                      type="button"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {paymentSettings.payment_instructions && (
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">{paymentInstructionsLabel(paymentSettings.payment_instructions)}</p>
                          </div>
                        )}
                      </>
                    )}

                    {!paymentSettings && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                        <p className="text-sm">Betalingsgegevens worden geladen...</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/5 border border-accent/20 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <p>
                        Klik op &quot;Aanvraag afronden&quot; om uw aanvraag op te slaan. U kunt daarna betalen.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Vorige
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button type="button" onClick={handleNext} className="gap-1">
                      Volgende
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Bezig met versturen...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Aanvraag afronden
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </form>
          </FormProvider>
        </Card>

      </div>
    </div>
  );
}
