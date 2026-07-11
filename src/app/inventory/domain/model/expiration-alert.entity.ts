import {BaseEntity} from '../../../shared/infrastructure/base-entity';

/**
 * The lifecycle status of an expiration alert.
 * PENDING alerts require a user decision; RESOLVED alerts are historical records.
 */
export type ExpirationAlertStatus = 'PENDING' | 'RESOLVED';

/**
 * The mitigation action taken to resolve an expiration alert.
 */
export type MitigationActionType = 'LIQUIDATION' | 'RETURN';

/**
 * Represents an Expiration Alert entity in the application.
 * @remarks
 * This class represents a persisted alert that requires a mitigation decision
 * (liquidation or return) on a batch that is close to expiring (7-day window).
 * It is distinct from the ephemeral dashboard/bell notifications (30-day, no action).
 * It implements the BaseEntity interface to ensure consistency across entities.
 * @see {@link BaseEntity}
 */
export class ExpirationAlert implements BaseEntity {
  /**
   * Creates a new ExpirationAlert instance.
   * @param alert - An object containing the id, batchId, productId, expirationDate,
   * triggeredAt, status, actionType, actionQuantity, and resolvedAt of the alert.
   * @returns A new instance of ExpirationAlert.
   */
  constructor(alert: {
    id: string;
    batchId: string;
    productId: string;
    expirationDate: string;
    triggeredAt: string;
    status: ExpirationAlertStatus;
    actionType: MitigationActionType | null;
    actionQuantity: number | null;
    resolvedAt: string | null;
  }) {
    this._id = alert.id;
    this._batchId = alert.batchId;
    this._productId = alert.productId;
    this._expirationDate = alert.expirationDate;
    this._triggeredAt = alert.triggeredAt;
    this._status = alert.status;
    this._actionType = alert.actionType;
    this._actionQuantity = alert.actionQuantity;
    this._resolvedAt = alert.resolvedAt;
  }

  /**
   * The unique identifier for the alert.
   */
  private _id: string;
  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value;
  }

  /**
   * The batch ID associated with this alert.
   */
  private _batchId: string;
  get batchId(): string {
    return this._batchId;
  }
  set batchId(value: string) {
    this._batchId = value;
  }

  /**
   * The product ID associated with this alert.
   */
  private _productId: string;
  get productId(): string {
    return this._productId;
  }
  set productId(value: string) {
    this._productId = value;
  }

  /**
   * The expiration date of the batch (ISO 8601 format).
   */
  private _expirationDate: string;
  get expirationDate(): string {
    return this._expirationDate;
  }
  set expirationDate(value: string) {
    this._expirationDate = value;
  }

  /**
   * The date and time the alert was triggered (ISO 8601 format).
   */
  private _triggeredAt: string;
  get triggeredAt(): string {
    return this._triggeredAt;
  }
  set triggeredAt(value: string) {
    this._triggeredAt = value;
  }

  /**
   * The lifecycle status of the alert (PENDING or RESOLVED).
   */
  private _status: ExpirationAlertStatus;
  get status(): ExpirationAlertStatus {
    return this._status;
  }
  set status(value: ExpirationAlertStatus) {
    this._status = value;
  }

  /**
   * The mitigation action taken (null while PENDING).
   */
  private _actionType: MitigationActionType | null;
  get actionType(): MitigationActionType | null {
    return this._actionType;
  }
  set actionType(value: MitigationActionType | null) {
    this._actionType = value;
  }

  /**
   * The effective quantity written off by the mitigation action (null while PENDING).
   */
  private _actionQuantity: number | null;
  get actionQuantity(): number | null {
    return this._actionQuantity;
  }
  set actionQuantity(value: number | null) {
    this._actionQuantity = value;
  }

  /**
   * The date and time the alert was resolved (null while PENDING).
   */
  private _resolvedAt: string | null;
  get resolvedAt(): string | null {
    return this._resolvedAt;
  }
  set resolvedAt(value: string | null) {
    this._resolvedAt = value;
  }

  /**
   * Whether the alert is still pending a user decision.
   * @returns true if the alert is PENDING, false otherwise.
   */
  isPending(): boolean {
    return this._status === 'PENDING';
  }
}
