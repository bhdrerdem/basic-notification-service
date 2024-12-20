export type UserFields = keyof User;

export class User {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;

  constructor(
    id: number,
    firstName: string,
    lastName: string,
    phoneNumber: string
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phoneNumber = phoneNumber;
  }

  static fromDB(dbRecord: any): User {
    return new User(
      dbRecord.id,
      dbRecord.first_name,
      dbRecord.last_name,
      dbRecord.phone_number
    );
  }

  getField(field: string): string {
    return this[field as keyof User] as string;
  }

  setField(field: string, value: string): void {
    (this as any)[field as keyof User] = value;
  }

  getFieldQuery(field: string): string | null {
    switch (field) {
      case "firstName":
        return `SELECT first_name FROM users WHERE id = ${this.id}`;
      default:
        return null;
    }
  }
}
