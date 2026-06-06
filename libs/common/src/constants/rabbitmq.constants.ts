// Queue Names
export const QUERY_QUEUE: string = 'query_queue';
export const PHONE_QUEUE: string = 'phone_queue';
export const AI_QUEUE: string = 'ai_queue';

// Message Patterns — Phone Service
export const PHONE_FIND_BY_BUDGET = 'phone.findByBudget' as const;
export const PHONE_FIND_BY_SPECS = 'phone.findBySpecs' as const;
export const PHONE_FIND_BY_ID = 'phone.findById' as const;
export const PHONE_SEARCH = 'phone.search' as const;
export const PHONE_COMPARE = 'phone.compare' as const;

// Admin Phone Message Patterns
export const PHONE_CREATE = 'phone.create' as const;
export const PHONE_UPDATE = 'phone.update' as const;
export const PHONE_DELETE = 'phone.delete' as const;
export const PHONE_FIND_ALL = 'phone.findAll' as const;

// Message Patterns — AI Service
export const AI_SUGGEST = 'ai.suggest' as const;
export const AI_SUGGEST_STREAM = 'ai.suggest.stream' as const;
export const AI_EMBED = 'ai.embed' as const;
export const AI_VECTOR_SEARCH = 'ai.vectorSearch' as const;

// MessagePattern (need response back)
export const QUERY_PARSE = 'query.parse';
export const QUERY_CLASSIFY = 'query.classify';
export const QUERY_SESSION_CREATE = 'query.session.create';
export const QUERY_SESSION_LIST = 'query.session.list';
export const QUERY_HISTORY_GET = 'query.history.get';

// EventPattern (fire and forget)
export const QUERY_HISTORY_SAVE = 'query.history.save';
export const QUERY_LOG_SAVE = 'query.log.save';
