'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LogOut,
  LayoutDashboard,
  Settings,
  Loader2,
  Users,
  Wallet,
  Search,
  Eye,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Landmark,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Euro,
  Home,
  ExternalLink,
  Link2,
  Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { dutchOption, formatEuro, formatDutchDate } from '@/lib/dutch-display';
import { databaseErrorMessage } from '@/lib/database-errors';
import type { VisitRequest, PaymentSettings } from '@/lib/types';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle2 }> = {
  pending: { label: "In behandeling", variant: 'secondary', icon: Clock },
  confirmed: { label: "Bevestigd", variant: 'default', icon: CheckCircle2 },
  cancelled: { label: "Geannuleerd", variant: 'destructive', icon: XCircle },
};

export default function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VisitRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<VisitRequest | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<PaymentSettings>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [propertyUrl, setPropertyUrl] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/admin');
      return;
    }
    setIsAuth(true);
    setIsLoading(false);
  }, [router]);

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('visit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Fout",
        description: databaseErrorMessage(error, "De aanvragen kunnen niet worden geladen"),
        variant: 'destructive',
      });
      return;
    }
    setRequests((data || []) as VisitRequest[]);
    setFilteredRequests((data || []) as VisitRequest[]);
  }, [toast]);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .order('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({
        title: "Fout",
        description: databaseErrorMessage(error, "De instellingen kunnen niet worden geladen"),
        variant: 'destructive',
      });
      return;
    }
    if (data) {
      setSettings(data as PaymentSettings);
      setSettingsForm(data as PaymentSettings);
    } else {
      setSettingsForm({ visit_fee: 50, show_rib: true, show_payment_link: true });
    }
  }, [toast]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuth) {
      fetchRequests();
      fetchSettings();
    }
  }, [isAuth, fetchRequests, fetchSettings]);

  useEffect(() => {
    let filtered = requests;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.first_name.toLowerCase().includes(q) ||
          r.last_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          (r.housing_reference || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, requests]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin');
  };

  const updatePropertyUrl = (value: string) => {
    setPropertyUrl(value);
    setShareUrl('');
    try {
      const listing = new URL(value);
      if (listing.protocol !== 'https:' && listing.protocol !== 'http:') return;
      const formUrl = new URL('/', window.location.origin);
      formUrl.searchParams.set('property_url', listing.toString());
      setShareUrl(formUrl.toString());
    } catch {
      // Wait until a complete listing URL is entered.
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Gekopieerd', description: 'De link naar het aanvraagformulier is gekopieerd' });
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from('visit_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Fout",
        description: "De status kan niet worden bijgewerkt",
        variant: 'destructive',
      });
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    setSelectedRequest((prev) => (prev ? { ...prev, status } : prev));
    toast({
      title: "Status bijgewerkt",
      description: "De status van de aanvraag is gewijzigd",
    });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const fee = Number(settingsForm.visit_fee);
      if (!Number.isFinite(fee) || fee < 0) {
        toast({ title: "Fout", description: "Het bedrag moet nul of een positief getal zijn.", variant: 'destructive' });
        return;
      }
      const updateData = {
        show_rib: settingsForm.show_rib ?? true,
        show_payment_link: settingsForm.show_payment_link ?? true,
        rib_holder: settingsForm.rib_holder || null,
        rib_iban: settingsForm.rib_iban || null,
        rib_bic: settingsForm.rib_bic || null,
        rib_bank_name: settingsForm.rib_bank_name || null,
        payment_link: settingsForm.payment_link || null,
        visit_fee: fee,
        payment_instructions: settingsForm.payment_instructions || null,
        updated_at: new Date().toISOString(),
      };

      const query = settings?.id
        ? supabase.from('payment_settings').update(updateData).eq('id', settings.id)
        : supabase.from('payment_settings').insert(updateData);
      const { data: savedSettings, error } = await query.select('*').single();
      if (error) throw error;
      setSettings(savedSettings as PaymentSettings);
      setSettingsForm(savedSettings as PaymentSettings);

      toast({
        title: "Instellingen opgeslagen",
        description: "De betalingsgegevens zijn bijgewerkt",
      });

    } catch (error) {
      toast({
        title: "Fout",
        description: databaseErrorMessage(error, "De instellingen kunnen niet worden opgeslagen"),
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuth) return null;

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const confirmedCount = requests.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-base sm:text-lg block leading-tight">RealEstate dashboard</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Beheer van bezichtigingsaanvragen</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Uitloggen</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.length}</p>
                <p className="text-sm text-muted-foreground">Totaal aanvragen</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">In behandeling</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedCount}</p>
                <p className="text-sm text-muted-foreground">Bevestigd</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="requests" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Aanvragen
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Betalingsinstellingen
            </TabsTrigger>
            <TabsTrigger value="share" className="gap-2">
              <Link2 className="w-4 h-4" />
              Formulierlink
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="animate-fade-in">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Bezichtigingsaanvragen</CardTitle>
                <CardDescription>Bekijk en beheer alle ontvangen aanvragen</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoeken op naam, e-mailadres of telefoonnummer..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Alle statussen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statussen</SelectItem>
                      <SelectItem value="pending">In behandeling</SelectItem>
                      <SelectItem value="confirmed">Bevestigd</SelectItem>
                      <SelectItem value="cancelled">Geannuleerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Naam</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Woning</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">Bezichtigingsdatum</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            Geen aanvragen gevonden
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRequests.map((req) => {
                          const status = statusConfig[req.status] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{req.first_name} {req.last_name}</p>
                                  <p className="text-xs text-muted-foreground">{req.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div>
                                  <p className="text-sm">{dutchOption(req.housing_type)}</p>
                                  <p className="text-xs text-muted-foreground">{req.housing_reference || "Niet opgegeven"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">
                                {formatDutchDate(req.preferred_date)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={status.variant} className="gap-1">
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequest(req)}
                                  className="gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  Bekijken
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="animate-fade-in">
            <Card className="max-w-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aanvraaglink voor een woning</CardTitle>
                <CardDescription>Voeg de advertentielink toe en stuur het ingevulde formulier naar de klant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="property_url">Link van de woningadvertentie</Label>
                  <Input id="property_url" type="url" placeholder="https://voorbeeld.nl/woning/123" value={propertyUrl} onChange={(event) => updatePropertyUrl(event.target.value)} />
                </div>
                {shareUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="generated_form_url">Link om naar de klant te sturen</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input id="generated_form_url" readOnly value={shareUrl} />
                      <Button type="button" onClick={copyShareUrl} className="gap-2 shrink-0"><Copy className="w-4 h-4" /> Kopieer link</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">De woninglink wordt automatisch ingevuld in het aanvraagformulier.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RIB Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Bankgegevens</CardTitle>
                      <CardDescription>Zichtbaar voor aanvragers voor bankoverschrijvingen</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant={(settingsForm.show_rib ?? true) ? 'secondary' : 'outline'}
                    aria-pressed={settingsForm.show_rib ?? true}
                    onClick={() => setSettingsForm((prev) => ({ ...prev, show_rib: !(prev.show_rib ?? true) }))}
                    className="w-full whitespace-normal h-auto min-h-[44px]"
                  >
                    {(settingsForm.show_rib ?? true) ? "Bankgegevens verbergen" : "Bankgegevens tonen"}
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="rib_holder">Rekeninghouder</Label>
                    <Input
                      id="rib_holder"
                      placeholder="RealEstate"
                      value={settingsForm.rib_holder || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rib_holder: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rib_bank_name">Naam van de bank</Label>
                    <Input
                      id="rib_bank_name"
                      placeholder="Bijvoorbeeld ABN AMRO"
                      value={settingsForm.rib_bank_name || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rib_bank_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rib_iban">IBAN</Label>
                    <Input
                      id="rib_iban"
                      placeholder="NL91 ABNA 0417 1643 00"
                      className="font-mono text-sm"
                      value={settingsForm.rib_iban || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rib_iban: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rib_bic">BIC / SWIFT</Label>
                    <Input
                      id="rib_bic"
                      placeholder="ABNANL2A"
                      className="font-mono text-sm"
                      value={settingsForm.rib_bic || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, rib_bic: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Link & Fee */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Online betaling</CardTitle>
                      <CardDescription>Betaallink en bezichtigingskosten</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant={(settingsForm.show_payment_link ?? true) ? 'secondary' : 'outline'}
                    aria-pressed={settingsForm.show_payment_link ?? true}
                    onClick={() => setSettingsForm((prev) => ({ ...prev, show_payment_link: !(prev.show_payment_link ?? true) }))}
                    className="w-full whitespace-normal h-auto min-h-[44px]"
                  >
                    {(settingsForm.show_payment_link ?? true) ? "Betaallink verbergen" : "Betaallink tonen"}
                  </Button>
                  <div className="space-y-2">
                    <Label htmlFor="visit_fee">Bezichtigingskosten (EUR)</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="visit_fee"
                        type="number"
                        step="0.01"
                        placeholder="50"
                        className="pl-9"
                        value={settingsForm.visit_fee ?? ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, visit_fee: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_link">Online betaallink</Label>
                    <Input
                      id="payment_link"
                      placeholder="https://payment.example.com/..."
                      value={settingsForm.payment_link || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payment_link: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Link naar een betaalpagina, bijvoorbeeld voor iDEAL
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_instructions">Betalingsinstructies</Label>
                    <Textarea
                      id="payment_instructions"
                      placeholder="Instructies voor aanvragers..."
                      rows={4}
                      value={settingsForm.payment_instructions || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payment_instructions: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">Bankgegevens en de betaallink kunnen samen of afzonderlijk worden getoond. Sla uw wijzigingen op om uw keuze op het formulier toe te passen.</p>
            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSavingSettings} size="lg" className="gap-2 w-full sm:w-auto">
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Bezig met opslaan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Wijzigingen opslaan
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto [&_svg]:shrink-0">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Aanvraag van {selectedRequest.first_name} {selectedRequest.last_name}</DialogTitle>
                <DialogDescription>
                  Ontvangen op {new Date(selectedRequest.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Status change */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(v) => handleStatusChange(selectedRequest.id, v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">In behandeling</SelectItem>
                      <SelectItem value="confirmed">Bevestigd</SelectItem>
                      <SelectItem value="cancelled">Geannuleerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Personal info */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Users className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Persoonlijke gegevens</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Voornaam:</span> <span className="font-medium">{selectedRequest.first_name}</span></div>
                    <div><span className="text-muted-foreground">Achternaam:</span> <span className="font-medium">{selectedRequest.last_name}</span></div>
                    {selectedRequest.birth_date && (
                      <div><span className="text-muted-foreground">Geboortedatum:</span> <span className="font-medium">{formatDutchDate(selectedRequest.birth_date)}</span></div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Mail className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Contactgegevens</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">{selectedRequest.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">{selectedRequest.phone}</a>
                    </div>
                    {selectedRequest.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <span>{selectedRequest.address}, {selectedRequest.city} {selectedRequest.postal_code}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Housing */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Home className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Woning</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{dutchOption(selectedRequest.housing_type)}</span></div>
                    <div><span className="text-muted-foreground">Referentie:</span> <span className="font-medium">{selectedRequest.housing_reference || "Niet opgegeven"}</span></div>
                    {selectedRequest.housing_address && (
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Adres:</span> <span className="font-medium">{selectedRequest.housing_address}</span></div>
                    )}
                    {selectedRequest.housing_link && (
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Advertentie:</span>{' '}<a href={selectedRequest.housing_link} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline break-all">{selectedRequest.housing_link}</a></div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Visit preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Calendar className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Voorkeuren voor bezichtiging</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Datum:</span> <span className="font-medium">{formatDutchDate(selectedRequest.preferred_date)}</span></div>
                    <div><span className="text-muted-foreground">Tijdvak:</span> <span className="font-medium">{dutchOption(selectedRequest.preferred_time)}</span></div>
                    <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{dutchOption(selectedRequest.visit_type)}</span></div>
                  </div>
                </div>

                <Separator />

                {/* Rental project */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Briefcase className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Huurprofiel</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Maandinkomen:</span>{' '}
                      <span className="font-medium">
                        {selectedRequest.monthly_income !== null ? formatEuro(selectedRequest.monthly_income) : "Niet opgegeven"}
                      </span>
                    </div>
                    <div><span className="text-muted-foreground">Werksituatie:</span> <span className="font-medium">{dutchOption(selectedRequest.employment_situation)}</span></div>
                  </div>
                </div>

                {selectedRequest.message && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Bericht</h3>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{selectedRequest.message}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
