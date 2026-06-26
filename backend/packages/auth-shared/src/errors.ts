export class AppError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = "AppError";
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409);
        this.name = "ConflictError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not Found") {
        super(message, 404);
        this.name = "NotFoundError";
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "Too Many Requests") {
        super(message, 429);
        this.name = "TooManyRequestsError";
    }
}
