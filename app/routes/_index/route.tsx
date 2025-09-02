import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <>
      <style>{`
        .page {
          min-height: 100dvh;
          background: #0b0f1a;
          color: #e7edf6;
          display: grid;
          place-items: start center;
          overflow-x: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system;
        }
        .heroBg {
          position: fixed;
          inset: -20% -10% auto -10%;
          height: 420px;
          background:
            radial-gradient(60% 70% at 20% 30%, #1f3bff33 0%, transparent 70%),
            radial-gradient(50% 60% at 80% 20%, #00d4ff26 0%, transparent 60%),
            radial-gradient(40% 50% at 50% 80%, #ff4d4d22 0%, transparent 50%);
          filter: blur(40px);
          pointer-events: none;
          z-index: 0;
        }
        .container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 980px;
          padding: 56px 20px 80px;
        }
        .header { text-align: left; margin-bottom: 28px; }
        .badge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #111a2f;
          color: #9fb3ff;
          font: 600 12px/1.2 ui-sans-serif;
          border: 1px solid #24315a;
        }
        .title { margin: 14px 0 6px; font: 800 34px/1.15 Inter; }
        .subtitle { margin: 0; color: #b7c4e0; max-width: 72ch; }
        .code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New";
          background: #0f1629;
          border: 1px solid #223056;
          color: #d6e2ff;
          padding: 0 6px;
          border-radius: 6px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 18px;
          margin-top: 22px;
        }
        @media (max-width: 880px) {
          .grid { grid-template-columns: 1fr; }
        }
        .card {
          background: linear-gradient(180deg, #0f1629 0%, #0c1322 100%);
          border: 1px solid #1b2747;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .cardTitle { margin: 0 0 8px; font: 700 18px/1.25 Inter; }
        .cardText { margin: 0 0 10px; color: #c7d3ee; }
        .codeBlock {
          margin: 10px 0 12px;
          padding: 14px 16px;
          background: #0a1224;
          border: 1px solid #1b2747;
          border-radius: 12px;
          color: #dbe6ff;
          font: 500 13px/1.45 ui-monospace;
          white-space: pre;
          overflow-x: auto;
        }
        .list { margin: 8px 0 0; padding-left: 18px; color: #b7c4e0; }
        .form { display: grid; gap: 12px; margin-top: 8px; }
        .label { display: grid; gap: 6px; color: #c7d3ee; }
        .input {
          height: 42px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #1f2d52;
          background: #0b1224;
          color: #e7edf6;
          outline: none;
        }
        .input:focus {
          border-color: #335bff;
          box-shadow: 0 0 0 3px rgba(51,91,255,0.15);
        }
        .button {
          height: 42px;
          border: 1px solid #2a3c72;
          background: linear-gradient(180deg, #2b49ff 0%, #1735ff 100%);
          color: white;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .hint { margin-top: 10px; font-size: 13px; color: #9fb3ff; }
        .footer { margin-top: 20px; }
        .kickerList { margin: 0; padding-left: 18px; color: #9fb0d0; font-size: 14px; }
      `}</style>

      <div className="page">
        <div className="heroBg" />

        <main className="container">
          <header className="header">
            <span className="badge">Beta</span>
            <h1 className="title">Hello there 👋</h1>
            <p className="subtitle">
              I can’t ship this app via <span className="code">Distribution</span> due to current
              account limitations and app paperwork. You can still run it like any other Shopify app:
              fill your <span className="code">.env</span> and log in to your shop below.
            </p>
          </header>

          <section className="grid">
            <article className="card">
              <h2 className="cardTitle">Environment setup</h2>
              <p className="cardText">
                Create a <span className="code">.env</span> file with:
              </p>
              <pre className="codeBlock">{`SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=
SCOPES=
SESSION_SECRET=`}</pre>
              <ul className="list">
                <li><strong>SHOPIFY_APP_URL</strong> — your public app URL (host/tunnel).</li>
                <li><strong>SCOPES</strong> — comma-separated scopes (e.g. <span className="code">write_products,read_customers</span>).</li>
                <li><strong>SESSION_SECRET</strong> — any strong random string.</li>
              </ul>
            </article>
          </section>

          <footer className="footer">
            <ul className="kickerList">
              <li><strong>Standard Remix + Shopify stack</strong>. No custom setup needed.</li>
              <li><strong>Secure sessions</strong>. The app uses your <span className="code">SESSION_SECRET</span>.</li>
              <li><strong>Scalable later</strong>. When account/app status changes, switch to Distribution.</li>
            </ul>
          </footer>
        </main>
      </div>
    </>
  );
}
