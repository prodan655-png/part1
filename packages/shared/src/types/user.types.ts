export interface User {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserDto {
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
}

export interface UserDto {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}
