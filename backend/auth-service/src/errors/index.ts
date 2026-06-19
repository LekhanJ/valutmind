export class AppError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}