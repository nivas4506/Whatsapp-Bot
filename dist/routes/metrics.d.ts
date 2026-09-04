import client from 'prom-client';
export declare const metricsRouter: import("express-serve-static-core").Router;
export declare const inboundMessagesCounter: client.Counter<"type">;
export declare const faqHitsCounter: client.Counter<"category">;
export declare const escalationsCounter: client.Counter<"category" | "urgency">;
export declare const requirementsCreatedCounter: client.Counter<"category">;
export declare const httpRequestDuration: client.Histogram<"method" | "route" | "status_code">;
