import "./globals.css";

export const metadata = {
  title: "Dire Sport Fields | Dire Dawa",
  description: "Book football fields and split costs in Dire Dawa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}