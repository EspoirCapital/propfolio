import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from "./seed";

// Code the very first user (the admin) enters to bootstrap the app.
// Override via the ADMIN_INVITE_CODE environment variable if you want a
// different secret.
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE ?? "ECP-FOUNDER";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email || "").toLowerCase();
        const profile: { email: string; name?: string; inviteCode?: string } = { email };
        if (params.name) profile.name = String(params.name).trim();
        if (params.inviteCode) profile.inviteCode = String(params.inviteCode).trim();
        return profile;
      },
    }),
  ],
  callbacks: {
    // Only runs during sign-up (createAccount), never on a repeat sign-in.
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;

      const profile = args.profile;
      const email = String(profile.email || "").toLowerCase();
      const name = String(profile.name || "").trim() || email.split("@")[0];
      const inviteCode = String(profile.inviteCode || "").trim();

      const firstUser = await ctx.db.query("users").first();
      const isFirstUser = firstUser === null;

      let isAdmin = false;
      if (isFirstUser) {
        // First signup ever → the admin. Gate it on the bootstrap code so
        // signup is still invite-only.
        if (inviteCode !== ADMIN_INVITE_CODE) {
          throw new Error("Invalid invite code.");
        }
        isAdmin = true;
      } else {
        // Validate + mark the invite used in the same transaction.
        if (!inviteCode) throw new Error("Invite code is required.");
        const invite = await ctx.db
          .query("invites")
          .filter((q) => q.eq(q.field("code"), inviteCode))
          .first();
        if (!invite) throw new Error("Invalid invite code.");
        if (invite.usedById) throw new Error("This invite has already been used.");
        if (invite.expiresAt < Date.now()) throw new Error("This invite has expired.");
      }

      const userId = await ctx.db.insert("users", { name, email, isAdmin, inviteCode });

      if (!isFirstUser) {
        const invite = await ctx.db
          .query("invites")
          .filter((q) => q.eq(q.field("code"), inviteCode))
          .first();
        if (!invite) throw new Error("Invalid invite code.");
        await ctx.db.patch(invite._id, { usedById: userId, usedAt: Date.now() });
      }

      // Seed a fresh user with defaults.
      await ctx.db.insert("settings", { userId, ...DEFAULT_SETTINGS });
      for (const template of DEFAULT_TEMPLATES) {
        await ctx.db.insert("templates", { userId, ...template });
      }

      return userId;
    },
  },
});
