import './globals.css';

export const metadata = {
  title: 'Pyramid Code Assistant',
  description: 'Local AI Code Assistant powered by WebGPU and FastAPI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0d1117] text-[#c9d1d9] antialiased">
        {children}
      </body>
    </html>
  );
}
