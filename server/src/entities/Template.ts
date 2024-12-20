import { User } from "./User";

export class NotificationTemplate {
  id: string;
  key: string;
  language: string;
  title: string;
  body: string;
  queryParam: Record<string, any> | null;

  constructor(data: any) {
    this.id = data.id;
    this.key = data.key;
    this.language = data.language;
    this.title = data.title;
    this.body = data.body;
    this.queryParam = data.queryParam || null;
  }

  static fromDB(record: any): NotificationTemplate {
    return new NotificationTemplate({
      id: record.id,
      key: record.key,
      language: record.lang,
      title: record.title,
      body: record.body,
      queryParam: record.query_param,
    });
  }

  get requiredFields(): string[] {
    const fields = this.body.match(/{{(.*?)}}/g);
    if (!fields) {
      return [];
    }

    return fields.map((field) => field.replace(/[{}]/g, "").trim());
  }

  renderBody(user: User): string {
    return this.body.replace(
      /{{(.*?)}}/g,
      (_, key) => user.getField(key.trim()) || ""
    );
  }

  renderTitle(user: User): string {
    return this.title.replace(
      /{{(.*?)}}/g,
      (_, key) => user.getField(key.trim()) || ""
    );
  }
}
