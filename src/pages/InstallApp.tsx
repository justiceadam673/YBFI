import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Monitor,
  Apple,
  Share,
  MoreVertical,
  Plus,
  Download,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const InstallApp = () => {
  const steps = {
    ios: [
      { icon: Share, text: "Open Safari and visit this website" },
      { icon: Share, text: "Tap the Share button at the bottom of the screen" },
      { icon: Plus, text: 'Scroll down and tap "Add to Home Screen"' },
      { icon: Check, text: 'Tap "Add" in the top right corner' },
    ],
    android: [
      { icon: MoreVertical, text: "Open Chrome and visit this website" },
      { icon: MoreVertical, text: "Tap the three dots menu (⋮) in the top right" },
      { icon: Download, text: 'Tap "Install app" or "Add to Home Screen"' },
      { icon: Check, text: 'Tap "Install" to confirm' },
    ],
    desktop: [
      { icon: Monitor, text: "Open Chrome, Edge, or another supported browser" },
      { icon: Plus, text: "Look for the install icon (⊕) in the address bar" },
      { icon: Download, text: 'Click "Install" in the popup dialog' },
      { icon: Check, text: "The app will open in its own window" },
    ],
  };

  const benefits = [
    "Works offline - access content without internet",
    "Faster loading - cached content loads instantly",
    "Full-screen experience - no browser bars",
    "Home screen access - launch like a native app",
    "Push notifications - stay updated (coming soon)",
    "Less storage - smaller than traditional apps",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Install YBFI App
            </h1>
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Add YBFI to your home screen for the best experience - works offline and loads instantly!
          </p>
        </div>

        {/* Benefits */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Why Install?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* iOS */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  iPhone / iPad
                </CardTitle>
                <Badge variant="secondary">iOS</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.ios.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Note: Safari is required for iOS installation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Android */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Android
                </CardTitle>
                <Badge variant="secondary">Android</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.android.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Works with Chrome, Samsung Internet, and Edge
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Desktop */}
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Desktop
                </CardTitle>
                <Badge variant="secondary">Windows / Mac</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.desktop.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Works with Chrome, Edge, and Brave browsers
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Quick Visual Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Share className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">1. Open Menu</p>
                <p className="text-xs text-muted-foreground">Share or browser menu</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">2. Add to Home</p>
                <p className="text-xs text-muted-foreground">Find the install option</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-2">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm font-medium">3. Confirm</p>
                <p className="text-xs text-muted-foreground">Tap install or add</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is this a real app?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! It's called a Progressive Web App (PWA). It works just like a native app but doesn't need to be downloaded from an app store.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">How much storage does it use?</h3>
                <p className="text-sm text-muted-foreground">
                  Very little! PWAs are much smaller than traditional apps because they load content from the web.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I uninstall it?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, just like any other app. Long-press the icon and select remove/uninstall, or delete from your app settings.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Will it update automatically?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! The app updates automatically whenever you open it and new content is available.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InstallApp;
