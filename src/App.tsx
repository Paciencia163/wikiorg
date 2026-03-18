import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BookDetail from "./pages/BookDetail";
import ArticleView from "./pages/ArticleView";
import ArticleEditor from "./pages/ArticleEditor";
import AuthPage from "./pages/AuthPage";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/livro/:bookId" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
            <Route path="/livro/:bookId/artigo/:articleId" element={<ProtectedRoute><ArticleView /></ProtectedRoute>} />
            <Route path="/livro/:bookId/artigo/:articleId/editar" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
            <Route path="/livro/:bookId/capitulo/:chapterId/novo-artigo" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
            <Route path="/admin/utilizadores" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
