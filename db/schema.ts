import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const applications = sqliteTable('applications', {
 id: text('id').primaryKey(), company: text('company').notNull(), role: text('role').notNull(),
 platform: text('platform').notNull(), url: text('url').notNull(), applied: text('applied').notNull(),
 stage: text('stage').notNull(), requirements: text('requirements').notNull(), expectations: text('expectations').notNull(),
 notes: text('notes').notNull(), nextDate: text('next_date').notNull(), history: text('history').notNull(), updated: text('updated').notNull()
});
