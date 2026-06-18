import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="flex items-center justify-center gap-sm" style={{ marginBottom: '8px' }}>
          <Shield size={16} />
          <span className="font-semibold">Security Shop - Secure E-Commerce</span>
        </div>
        <p>
          Built for educational purposes — demonstrating web application security vulnerabilities and defenses.
        </p>
        <p style={{ marginTop: '4px' }}>
          © {new Date().getFullYear()} Security Shop · Information Security Project
        </p>
      </div>
    </footer>
  );
}
