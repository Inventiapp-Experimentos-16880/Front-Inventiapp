import {BaseEntity} from '../../../shared/infrastructure/base-entity';

export type StockMovementType = 'ENTRADA' | 'SALIDA';

/**
 * Represents a Stock Movement entity in the application.
 * @remarks
 * This class represents an inventory movement (entry or exit) belonging to a batch.
 * It implements the BaseEntity interface to ensure consistency across entities.
 * @see {@link BaseEntity}
 */
export class StockMovement implements BaseEntity {
  /**
   * Creates a new StockMovement instance.
   * @param movement - An object containing the id, productId, batchId, type, quantity, and occurredAt of the movement.
   * @returns A new instance of StockMovement.
   */
  constructor(movement: {
    id: string;
    productId: string;
    batchId: string;
    type: StockMovementType;
    quantity: number;
    occurredAt: string;
  }) {
    this._id = movement.id;
    this._productId = movement.productId;
    this._batchId = movement.batchId;
    this._type = movement.type;
    this._quantity = movement.quantity;
    this._occurredAt = movement.occurredAt;
  }

  /**
   * The unique identifier for the movement.
   */
  private _id: string;
  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value;
  }

  /**
   * The product ID associated with this movement.
   */
  private _productId: string;
  get productId(): string {
    return this._productId;
  }
  set productId(value: string) {
    this._productId = value;
  }

  /**
   * The batch ID associated with this movement.
   */
  private _batchId: string;
  get batchId(): string {
    return this._batchId;
  }
  set batchId(value: string) {
    this._batchId = value;
  }

  /**
   * The type of movement (ENTRADA or SALIDA).
   */
  private _type: StockMovementType;
  get type(): StockMovementType {
    return this._type;
  }
  set type(value: StockMovementType) {
    this._type = value;
  }

  /**
   * The quantity involved in this movement.
   */
  private _quantity: number;
  get quantity(): number {
    return this._quantity;
  }
  set quantity(value: number) {
    this._quantity = value;
  }

  /**
   * The date and time the movement occurred (ISO 8601 format).
   */
  private _occurredAt: string;
  get occurredAt(): string {
    return this._occurredAt;
  }
  set occurredAt(value: string) {
    this._occurredAt = value;
  }
}
