import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Copy, CreditCard, Smartphone, Building2, Heart, Sparkles, Gift } from "lucide-react";

const Partner = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleOpayUssd = async (method: string) => {
    if (!formData.name || !formData.email || !formData.phone || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("donations").insert({
        donor_name: formData.name,
        donor_email: formData.email,
        donor_phone: formData.phone,
        amount: parseFloat(formData.amount),
        payment_method: method,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: `Please complete your ${method} transfer to the account shown above. Your donation record has been saved.`,
      });

      setFormData({ name: "", email: "", phone: "", amount: "" });
    } catch (error) {
      console.error("Error saving donation:", error);
      toast({
        title: "Error",
        description: "Failed to save donation record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardPayment = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("donations").insert({
        donor_name: formData.name,
        donor_email: formData.email,
        donor_phone: formData.phone,
        amount: parseFloat(formData.amount),
        payment_method: "card",
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Coming Soon",
        description: "Card payment integration will be available soon. Please use Opay or USSD for now.",
      });

      setFormData({ name: "", email: "", phone: "", amount: "" });
    } catch (error) {
      console.error("Error saving donation:", error);
      toast({
        title: "Error",
        description: "Failed to process donation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/10" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-in">
                <Heart className="w-4 h-4" />
                Support the Mission
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
                Partner <span className="text-gradient">With Us</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Your generous contribution helps us spread the Gospel and impact lives. Every seed sown is a step towards transforming communities.
              </p>
            </div>
          </div>
        </section>

        {/* Donation Form */}
        <section className="py-12 container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card border-border/50 shadow-elegant overflow-hidden">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-gold">
                  <Gift className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-3xl">Give</CardTitle>
                <CardDescription className="text-base">
                  Choose your preferred payment method below
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="mt-1.5 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="mt-1.5 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="09012345678"
                        className="mt-1.5 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium">Amount (₦) *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="5000"
                        min="100"
                        className="mt-1.5 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="opay" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 glass-card p-1">
                    <TabsTrigger value="opay" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="hidden sm:inline">Opay</span>
                    </TabsTrigger>
                    <TabsTrigger value="ussd" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="hidden sm:inline">USSD</span>
                    </TabsTrigger>
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">Card</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="opay" className="space-y-4 mt-6">
                    <div className="bg-muted/50 p-6 rounded-xl space-y-4 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Account Number</p>
                          <p className="text-2xl font-bold text-foreground">2075219233</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard("2075219233", "Account number")}
                          className="hover:shadow-md transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Account Name</p>
                          <p className="text-lg font-semibold">LUTHER, FAITH RETPLANG</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard("LUTHER, FAITH RETPLANG", "Account name")}
                          className="hover:shadow-md transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bank</p>
                        <p className="text-lg font-semibold">Kuda Microfinance Bank</p>
                      </div>
                    </div>
                    <Button
                      className="w-full shadow-elegant hover:shadow-gold transition-all"
                      onClick={() => handleOpayUssd("Kuda Microfinance Bank")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "I've Made the Transfer"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="ussd" className="space-y-4 mt-6">
                    <div className="bg-muted/50 p-6 rounded-xl space-y-4 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Account Number</p>
                          <p className="text-2xl font-bold text-foreground">2075219233</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard("2075219233", "Account number")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Account Name</p>
                          <p className="text-lg font-semibold">LUTHER, FAITH RETPLANG</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard("LUTHER, FAITH RETPLANG", "Account name")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bank</p>
                        <p className="text-lg font-semibold">Kuda Microfinance Bank</p>
                      </div>
                      <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <p className="text-sm font-medium mb-2 text-primary">USSD Instructions:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                          <li>Dial your bank's USSD code</li>
                          <li>Select Transfer option</li>
                          <li>Enter the account number above</li>
                          <li>Enter the amount</li>
                          <li>Confirm the transaction</li>
                        </ol>
                      </div>
                    </div>
                    <Button
                      className="w-full shadow-elegant hover:shadow-gold transition-all"
                      onClick={() => handleOpayUssd("ussd")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "I've Made the Transfer"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="card" className="space-y-4 mt-6">
                    <div className="bg-muted/50 p-8 rounded-xl text-center border border-border/50">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-semibold mb-2">Secure Card Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Card payment integration coming soon. We'll redirect you to a secure payment gateway.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCardPayment}
                      disabled={isSubmitting}
                      variant="secondary"
                    >
                      {isSubmitting ? "Processing..." : "Pay with Card (Coming Soon)"}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl text-center">
                  <p className="text-muted-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Thank you for your generous contribution. Your donation helps us continue our mission.
                    <Sparkles className="w-4 h-4 text-accent" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Partner;