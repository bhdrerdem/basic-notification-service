export class UserPushNotification {
  id: number;
  isDeleted: boolean;
  userId: number;
  pushToken: string | null;
  oneSignalId: string | null;
  createdDate: Date | null;
  modifiedDate: Date | null;

  constructor(
    id: number,
    isDeleted: boolean,
    userId: number,
    pushToken: string | null,
    oneSignalId: string | null,
    createdDate: Date | null,
    modifiedDate: Date | null
  ) {
    this.id = id;
    this.isDeleted = isDeleted;
    this.userId = userId;
    this.pushToken = pushToken;
    this.oneSignalId = oneSignalId;
    this.createdDate = createdDate;
    this.modifiedDate = modifiedDate;
  }

  static fromDB(dbRecord: any): UserPushNotification {
    return new UserPushNotification(
      dbRecord.id,
      dbRecord.is_deleted,
      dbRecord.user_id,
      dbRecord.push_token,
      dbRecord.one_signal_id,
      dbRecord.created_date ? new Date(dbRecord.CreatedDate) : null,
      dbRecord.modified_date ? new Date(dbRecord.ModifiedDate) : null
    );
  }
}
