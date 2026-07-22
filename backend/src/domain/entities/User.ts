import type { UserRole } from '@senvirox/shared';

export interface UserProps {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly organizationId: string | null;
  readonly passwordHash: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    const email = props.email.trim().toLowerCase();
    if (!email.includes('@') || email.length < 5) {
      throw new Error('Invalid user email');
    }
    if (!props.fullName.trim()) {
      throw new Error('fullName is required');
    }
    if (!props.passwordHash) {
      throw new Error('passwordHash is required');
    }
    return new User({
      ...props,
      email,
      fullName: props.fullName.trim(),
    });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get organizationId(): string | null {
    return this.props.organizationId;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  withPasswordHash(passwordHash: string): User {
    return User.create({
      ...this.props,
      passwordHash,
      updatedAt: new Date(),
    });
  }

  toJSON(): Omit<UserProps, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safe } = this.props;
    return safe;
  }

  toAuthDto() {
    return {
      id: this.props.id,
      email: this.props.email,
      fullName: this.props.fullName,
      role: this.props.role,
      organizationId: this.props.organizationId,
    };
  }
}
