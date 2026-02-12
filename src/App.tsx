import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Messages from "./pages/Messages";
import Gallery from "./pages/Gallery";
import Testimonies from "./pages/Testimonies";
import QA from "./pages/QA";
import Blog from "./pages/Blog";
import Partner from "./pages/Partner";
import Books from "./pages/Books";
import AdminQA from "./pages/AdminQA";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminUsers from "./pages/AdminUsers";
import Registration from "./pages/Registration";
import VisionsDreams from "./pages/VisionsDreams";
import GospelBuddy from "./pages/GospelBuddy";
import InstallApp from "./pages/InstallApp";
import PrayerRequests from "./pages/PrayerRequests";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import InstallPrompt from "./components/InstallPrompt";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
            <Route path="/testimonies" element={<ProtectedRoute><Testimonies /></ProtectedRoute>} />
            <Route path="/qa" element={<ProtectedRoute><QA /></ProtectedRoute>} />
            <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
            <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
            <Route path="/visions-dreams" element={<ProtectedRoute><VisionsDreams /></ProtectedRoute>} />
            <Route path="/gospel-buddy" element={<ProtectedRoute><GospelBuddy /></ProtectedRoute>} />
            <Route path="/prayer-requests" element={<ProtectedRoute><PrayerRequests /></ProtectedRoute>} />
            <Route path="/install" element={<ProtectedRoute><InstallApp /></ProtectedRoute>} />
            <Route path="/admin-qa" element={<ProtectedRoute><AdminQA /></ProtectedRoute>} />
            <Route path="/admin-announcements" element={<ProtectedRoute><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin-users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/registration" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <InstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
