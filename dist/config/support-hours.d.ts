export interface SupportHoursStatus {
    isWithinHours: boolean;
    message?: string;
}
export declare function checkSupportHours(date?: Date): SupportHoursStatus;
