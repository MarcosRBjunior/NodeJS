import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RotaProtegida } from './components/RotaProtegida';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { BookDetail } from './pages/BookDetail';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app__conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/livros/:id" element={<BookDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} />
          <Route
            path="/admin"
            element={
              <RotaProtegida exigirAdmin>
                <Admin />
              </RotaProtegida>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
