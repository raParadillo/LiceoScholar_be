import { jwt } from 'hono/jwt';

export const authMiddleware = jwt({
    secret: 'my-secret-key-123',
    alg: 'HS256'
});