import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LangProvider } from './contexts/LangContext';
import { ModeProvider } from './contexts/ModeContext';

import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';

import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import ShipperPortal from './pages/ShipperPortal';

import './App.css';

function App() {
  return (
    <Router>
      <LangProvider>
        <AuthProvider>
          <ModeProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/shipper" element={<ShipperPortal />} />
                </Routes>
              </main>
              <Footer />
              <ChatWidget />
            </CartProvider>
          </ModeProvider>
        </AuthProvider>
      </LangProvider>
    </Router>
  );
}

export default App;
