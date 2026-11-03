import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { jwt } from "better-auth/plugins/jwt";


const isProd = process.env.NODE_ENV === "production";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("StudioSpace");

export const auth = betterAuth({
    database: mongodbAdapter(db, { client }),
    plugins: [
        jwt({
            sessionCookieCache: true,
        }),
    ],
    session: {
        cookieCache: {
            strategy: "jwt",
            enabled: true,
            maxAge: 60 * 60 * 24 * 7,
        },
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
        autoSignIn: false,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },

    // Must be outside socialProviders
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },

    // Force cookie behaviour based on environment
    advanced: {
        useSecureCookies: isProd,
        defaultCookieAttributes: {
            sameSite: "lax",
            path: "/",
        },
    },



    trustedOrigins: [
        "http://localhost:3000",
        "https://studio-space-client-five.vercel.app",
    ],
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
});

export const authMiddleware = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            return res.status(401).json({ message: "Unauthorized: please login" });
        }

        req.user = {
            email: session.user.email,
            name: session.user.name,
            id: session.user.id,
        };

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ message: "Unauthorized: invalid or expired session" });
    }
};

export default auth;
