export const metadata = {
  title: "Uploader",
  description: "My Next.js app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}