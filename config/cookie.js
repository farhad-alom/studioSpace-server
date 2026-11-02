export const isProd = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};