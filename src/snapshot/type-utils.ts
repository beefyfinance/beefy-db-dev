export type TupleUnion<KeyUnion extends string, Result extends any[] = []> = {
  [Key in KeyUnion]: Exclude<KeyUnion, Key> extends never
    ? [...Result, Key]
    : TupleUnion<Exclude<KeyUnion, Key>, [...Result, Key]>;
}[KeyUnion];

export type TupleToObject<T extends readonly string[], V> = {
  [K in T[number]]: V;
};
