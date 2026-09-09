import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./login-page";
import { useAuthStore } from "../store";
import { ApiError } from "@/lib/api/types";
import * as authApi from "../api";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<div>Operator console</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function submitCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "someone@gasa.test");
  await user.type(screen.getByLabelText("Password"), "password");
  await user.click(screen.getByRole("button", { name: /Sign in/ }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "guest", token: null, user: null, sessionNotice: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // The portal test stubs global fetch — leaving it stubbed would silently
    // hand the mock to every later test in the file.
    vi.unstubAllGlobals();
  });

  // Asserted at the fetch boundary rather than by spying on login(): the
  // `portal` discriminator is added inside api.ts, so a spy on that wrapper
  // would never see the field this test exists to protect. Getting this
  // wrong is what lets a merchant account into the operator portal.
  it('sends portal: "platform" so the backend can reject other portals\' accounts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "tok",
          user: {
            id: 1,
            name: "Admin",
            email: "someone@gasa.test",
            roles: ["platform_admin"],
            merchant: null,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderPage();
    await submitCredentials();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/login");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "someone@gasa.test",
      password: "password",
      portal: "platform",
    });
  });

  it("explains a wrong-portal account on 403 portal_forbidden", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new ApiError({
        status: 403,
        message: "This account can't access this portal.",
        code: "portal_forbidden",
      }),
    );

    renderPage();
    await submitCredentials();

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/can't access the admin platform/);
  });

  it("shows a generic message on bad credentials", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(
      new ApiError({
        status: 401,
        message: "Invalid credentials.",
        code: "invalid_credentials",
      }),
    );

    renderPage();
    await submitCredentials();

    expect(await screen.findByText("Email or password is incorrect")).toBeInTheDocument();
  });

  it("validates locally before calling the API", async () => {
    const login = vi.spyOn(authApi, "login");
    const user = userEvent.setup();

    renderPage();
    await user.click(screen.getByRole("button", { name: /Sign in/ }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
