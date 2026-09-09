/**
 * The organization a user belongs to. The platform admin is the neutral
 * operator above every tenant, so a Platform Admin's own `organization` is
 * always null — this type exists to read the field on other portals' users,
 * not to describe this portal's own session.
 */
export type OrganizationKind = "merchant" | "company";

export interface Organization {
  id: number;
  name: string;
  kind: OrganizationKind;
}

/**
 * The flat user object returned by /auth/login and /auth/me.
 *
 * Mirrors the merchant portal's AuthUser, which is the same endpoint and so
 * the same payload — including `merchant`, which is always null for a
 * platform admin. It is typed here rather than omitted because the field is
 * genuinely present in the response; pretending otherwise would make this
 * type lie about the contract.
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  /** Always null for a platform admin — they operate the marketplace, they don't own a merchant. */
  merchant: Organization | null;
}

/** Field name -> list of validation messages, as returned on 422 responses. */
export type ApiFieldErrors = Record<string, string[]>;

/** Shape of every error response from the backend: { message, code, errors? }. */
export interface ApiErrorShape {
  message: string;
  code?: string;
  errors?: ApiFieldErrors;
}

/** Thrown by the api client for any non-2xx response, and for network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors?: ApiFieldErrors;

  constructor({
    status,
    message,
    code,
    errors,
  }: {
    status: number;
    message: string;
    code?: string;
    errors?: ApiFieldErrors;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}
