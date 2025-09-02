import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";
import styles from "./styles.module.css";

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
    <div className={styles.page}>
      <div className={styles.heroBg} />

      <main className={styles.container}>
        <header className={styles.header}>
          <span className={styles.badge}>Beta</span>
          <h1 className={styles.title}>Hello there 👋</h1>
          <p className={styles.subtitle}>
            I can’t ship this app via <span className={styles.code}>Distribution</span> due to current
            account limitations and app paperwork. You can still run it like any other Shopify app:
            fill your <span className={styles.code}>.env</span> and log in to your shop below.
          </p>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Environment setup</h2>
            <p className={styles.cardText}>
              Create a <span className={styles.code}>.env</span> file with:
            </p>

            <pre className={styles.codeBlock}>
              {`SHOPIFY_API_KEY=
              SHOPIFY_API_SECRET=
              SHOPIFY_APP_URL=
              SCOPES=
              SESSION_SECRET=`}
            </pre>

            <ul className={styles.list}>
              <li>
                <strong>SHOPIFY_APP_URL</strong> — your public app URL (host/tunnel).
              </li>
              <li>
                <strong>SCOPES</strong> — comma-separated scopes (e.g.{" "}
                <span className={styles.code}>write_products,read_customers</span>).
              </li>
              <li>
                <strong>SESSION_SECRET</strong> — any strong random string.
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Log in to your shop</h2>
            <p className={styles.cardText}>
              Enter your full shop domain to continue.
            </p>

            <div className={styles.hint}>
              Don’t have admin distribution? No problem — installing via direct auth works fine for
              development and private use.
            </div>
          </article>
        </section>

        <footer className={styles.footer}>
          <ul className={styles.kickerList}>
            <li>
              <strong>Standard Remix + Shopify stack</strong>. No custom setup needed.
            </li>
            <li>
              <strong>Secure sessions</strong>. The app uses your{" "}
              <span className={styles.code}>SESSION_SECRET</span>.
            </li>
            <li>
              <strong>Scalable later</strong>. When account/app status changes, switch to Distribution.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}
