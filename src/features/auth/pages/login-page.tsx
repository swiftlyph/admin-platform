import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ApiFieldErrors } from "@/lib/api/types";
import { login } from "../api";
import { useAuthStore } from "../store";
import { LoginField } from "../components/login-field";
import { toLoginErrorPresentation } from "../login-error-message";

interface LocationState {
  from?: { pathname: string };
}

/**
 * `/login` — "the vault": a framed plate rather than a floating card.
 *
 * A card sits *on* a page; a plate held inside its own registration frame is
 * *mounted* in one, and that mounting is what reads as a secured entry point
 * instead of a generic sign-in box. The frame is a single hairline with
 * corner ticks, kept well clear of the plate — the gap between the two is
 * the whole device.
 *
 * Premium here is proportion and type, not ornament. There is no gradient
 * behind the form, no glass, no brand hue (the console palette is
 * deliberately hue-free — a decorative gradient reads as storefront). What
 * does the work: a display-scale title against a mono micro-label, a strict
 * vertical rhythm, hairlines that carry their own labels, and exactly one
 * lit control.
 *
 * No mark is used, by request — the seal in the footer band is typographic.
 *
 * The visual treatment lives in ../login.css; the field control and the
 * error-copy mapping are their own modules, leaving this file to the form's
 * behaviour and layout.
 */
export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const sessionNotice = useAuthStore((s) => s.sessionNotice);
  const setSessionNotice = useAuthStore((s) => s.setSessionNotice);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setAuthed(token, user);
      // Role routing is left to RequirePlatformAdmin rather than branched on
      // here: a non-admin who authenticates lands on /app and is redirected
      // to /no-access by the guard, so exactly one place decides who belongs
      // inside the app shell.
      const from = (location.state as LocationState | null)?.from?.pathname ?? "/app";
      navigate(from, { replace: true });
    },
    onError: (error: unknown) => {
      // Every backend failure mode maps to copy in one place — see
      // ../login-error-message.ts.
      const { fieldErrors, alert, cooldown } = toLoginErrorPresentation(error);
      setFieldErrors(fieldErrors);
      setFormAlert(alert);
      setCooldown(cooldown);
    },
  });

  // Already signed in — don't show the login form at all.
  if (status === "authed") {
    return <Navigate to="/app" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormAlert(null);

    const errors: ApiFieldErrors = {};
    if (!email.trim()) errors.email = ["Email is required."];
    if (!password) errors.password = ["Password is required."];
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    mutation.mutate({ email, password });
  }

  const submitDisabled = mutation.isPending || cooldown > 0;

  return (
    <div className="login-canvas flex min-h-svh items-center justify-center px-5 py-10">
      {/*
        The registration frame. It holds the plate at arm's length (p-2.5)
        rather than wrapping it tightly — the visible gap between hairline
        and plate is what turns a card into something mounted.
      */}
      <div className="vault-frame relative w-full max-w-[26.5rem] rounded-[0.9rem] p-2.5">
        <VaultCornerTicks />

        <section className="vault-plate relative overflow-hidden rounded-[0.55rem] bg-card">
          {/*
            No header band and no footer band. Both were chrome wrapped around
            a two-field form: a status dot that reported nothing, a "GASA
            Admin" wordmark saying what the title says, and a "GASA · Platform"
            seal saying it a third time. Stripping them leaves one surface with
            one thing on it.

            The two elements that carried real information survive, relocated:
            the theme toggle (a control) floats in the corner, and the
            staff-only warning (a genuine wrong-door signal) folds into the
            intro sentence below.

            Pushed into the corner and shrunk to icon-sm. With no band to sit
            in, a default-size toggle level with the title's cap height reads
            as a peer of the heading rather than a utility; tucked tight and
            dimmed until hover, it stays available without asking to be read.
          */}
          <div className="absolute right-2 top-2 [&_button]:size-8 [&_button]:cursor-pointer [&_svg]:size-4 [&_button]:text-muted-foreground/60 [&_button:hover]:text-foreground">
            <ThemeToggle />
          </div>

          <div className="px-8 pb-9 pt-9">
            <LoginMasthead />

            {sessionNotice && (
              <div
                role="status"
                className="mt-6 flex items-start justify-between gap-3 rounded-md border border-warning/35 bg-warning/8 py-2.5 pl-3 pr-2"
              >
                <span className="text-[0.8125rem] leading-snug text-foreground/90">
                  {sessionNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setSessionNotice(null)}
                  aria-label="Dismiss"
                  className="-mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm text-sm leading-none text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  ✕
                </button>
              </div>
            )}

            {formAlert && <FormAlert message={formAlert} />}

            {/*
              A plain hairline, no label. "Credentials" over two fields named
              Email and Password was ceremony — the rule's job here is to
              close the intro and open the form, and it does that on its own.
            */}
            <div aria-hidden="true" className="vault-rule mt-6" />

            <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <LoginField
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="you@gasa.com"
                value={email}
                onChange={setEmail}
                errors={fieldErrors.email}
              />

              <LoginField
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                errors={fieldErrors.password}
                revealable
              />

              <button
                type="submit"
                disabled={submitDisabled}
                className="login-submit mt-2 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.375rem] text-[0.8125rem] font-semibold tracking-[0.02em] text-primary-foreground transition-[filter,transform,box-shadow,opacity] hover:not-disabled:brightness-110 active:not-disabled:translate-y-px disabled:cursor-not-allowed disabled:bg-primary disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {mutation.isPending && (
                  // Only on the pending branch: a spinner next to "Try again
                  // in 42s" would suggest work is happening during a cooldown,
                  // when nothing is in flight.
                  <span
                    aria-hidden="true"
                    className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
                  />
                )}
                {cooldown > 0
                  ? `Try again in ${cooldown}s`
                  : mutation.isPending
                    ? "Signing in…"
                    : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Two short rules meeting at each corner of the registration frame. */
function VaultCornerTicks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="vault-tick absolute -left-px -top-px border-l border-t rounded-tl-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -right-px -top-px border-r border-t rounded-tr-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -bottom-px -left-px border-b border-l rounded-bl-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -bottom-px -right-px border-b border-r rounded-br-[0.9rem]"
      />
    </>
  );
}

/**
 * Brand first, action second. GASA identifies the surface; "Sign in" is what
 * you do on it. Burying the wordmark mid-sentence made the action the loudest
 * thing on an unidentified plate — the inverse of how a secured entry point
 * should read.
 *
 * The lines are deliberately different *kinds* of type, not sizes of one: the
 * wordmark is the console's mono device at display scale with wide tracking
 * (letterforms held apart read as engraved rather than typed), and the action
 * below it is the sans at a quiet weight.
 *
 * Grouped, not evenly stacked. "Sign in" belongs to the wordmark above it
 * (tight gap — one unit), while the description is a separate thought set
 * further away. Three equal gaps read as a list; two tight then one loose
 * reads as a mark with a caption.
 *
 * The mark sits *within* a rule rather than above one — short symmetrical
 * stubs, not full-width rules. A rule running to both edges reads as a
 * divider (and collides with the theme toggle); a pair of stubs reads as a
 * masthead holding the mark.
 */
function LoginMasthead() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span aria-hidden="true" className="vault-rule h-px w-10" />
        <p className="font-mono text-[1.5rem] font-bold uppercase leading-none tracking-[0.22em] text-foreground">
          {/* Optical centring: the wide tracking adds a trailing space after
              the final letter that the eye reads as a left bias. */}
          <span className="-mr-[0.22em]">Gasa</span>
        </p>
        <span aria-hidden="true" className="vault-rule h-px w-10" />
      </div>
      {/*
        Three lines, three registers. The mark is mono/bold/wide; this is the
        action, so it takes the sans at full foreground and a size clearly
        above the line beneath it; the description then drops a step in both
        size and colour. Previously the action and the description shared a
        size and nearly a colour, so the pair read as one undifferentiated
        grey block under the mark.

        Sans rather than the mono micro-label: EMAIL and PASSWORD below
        already use that device, and a third identical micro-label here
        flattens the mark into the form.
      */}
      <h1 className="mt-3 text-[1rem] font-semibold leading-none tracking-[-0.01em] text-foreground">
        Sign in
      </h1>
      {/*
        One statement, not two fragments welded together. "Platform
        operations." named nothing — it was a category label standing where a
        sentence belonged, and pairing it with the merchant redirect gave two
        unrelated thoughts equal weight.

        Now the first line says what this console actually is, and the
        wrong-door signal follows as the secondary aside it always was.
      */}
      <p className="mt-2.5 text-[0.78125rem] leading-relaxed text-muted-foreground/85">
        Operations console for GASA staff.
      </p>
    </div>
  );
}

/**
 * An icon, not just red text: colour alone is the one signal a colour-blind
 * operator can miss, and this is the message that tells them why they cannot
 * get in.
 */
function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-2.5 rounded-md border border-destructive/35 bg-destructive/8 px-3 py-2.5"
    >
      <span
        aria-hidden="true"
        className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-destructive text-[0.625rem] font-bold leading-none text-destructive-foreground"
      >
        !
      </span>
      <p className="text-[0.8125rem] leading-snug text-destructive">{message}</p>
    </div>
  );
}
