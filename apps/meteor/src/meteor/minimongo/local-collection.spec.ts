import { describe, it, expect } from "vitest";
import { LocalCollection } from "meteor/minimongo"; // Adjust path accordingly
import { Tracker } from "meteor/tracker";
import { MongoID } from "meteor/mongo-id";

// Utility type for the document structure used in these tests
type TestDoc = {
  _id: string | MongoID.ObjectID;
  x?: number;
  y?: number;
  z?: () => number;
  value?: string;
  loc?: {
    type: string;
    coordinates: number[] | number[][][];
  };
};

describe("minimongo - wrapTransform", () => {

  it("returns falsy when transforming no function", () => {
    expect(LocalCollection.wrapTransform(undefined)).toBeFalsy();
    expect(LocalCollection.wrapTransform(null)).toBeFalsy();
  });

  it("allows transformations that do not change the ID", () => {
    const validTransform = (doc: TestDoc): TestDoc => {
      const newDoc = { ...doc };
      delete newDoc.x;
      newDoc.y = 42;
      newDoc.z = () => 43;
      return newDoc;
    };

    const transformed = LocalCollection.wrapTransform(validTransform)({ _id: "asdf", x: 54 });

    expect(Object.keys(transformed)).toEqual(["_id", "y", "z"]);
    expect(transformed.y).toBe(42);
    expect(typeof transformed.z).toBe("function");
    expect(transformed.z?.()).toBe(43);
  });

  it("works with ObjectIDs even if reference equality fails", () => {
    const oid1 = new MongoID.ObjectID();
    const oid2 = new MongoID.ObjectID(oid1.toHexString());

    const result = LocalCollection.wrapTransform(() => ({ _id: oid2 }))({ _id: oid1 });
    expect(result).toEqual({ _id: oid2 });
  });

  it.for([
    "asdf", new MongoID.ObjectID(), false, null, true,
    27, [123], /adsf/, new Date(), () => { }, undefined,
  ])("throws error if transform function does not return an object %s", (invalidValue) => {

    const wrapped = LocalCollection.wrapTransform(() => invalidValue);
    expect(() => {
      wrapped({ _id: "asdf" });
    }).toThrow(/transform must return object/);
  });

  it("throws error if transform changes the _id", () => {
    const wrapped = LocalCollection.wrapTransform((doc: TestDoc) => {
      return { ...doc, _id: "x" };
    });

    expect(() => {
      wrapped({ _id: "y" });
    }).toThrow(/can't have different _id/);
  });

  it("allows transformations that remove the _id", () => {
    const result = LocalCollection.wrapTransform(({ _id, ...doc }: TestDoc) => {
      return { ...doc };
    })({ _id: "a", x: 2 });

    expect(result).toEqual({ _id: "a", x: 2 });
  });

  it("ensures wrapped transform functions are non-reactive", () => {
    const unwrapped = (doc: TestDoc) => {
      expect(Tracker.active).toBe(false);
      return doc;
    };

    // Tracker.autorun provides the reactive context
    const computation = Tracker.autorun(() => {
      expect(Tracker.active).toBe(true);
      LocalCollection.wrapTransform(unwrapped)({ _id: "xxx" });
    });

    computation.stop();
  });
});

describe("minimongo - removals", () => {
  it("removes all matching documents with $in operator", () => {
    const coll = new LocalCollection<TestDoc>();
    const ids = ["id1", "id2", "id3", "id4"];

    ids.forEach((id) => {
      coll.insert({ _id: id, value: `item-${id}` });
    });

    expect(coll.find().count()).toBe(4);

    const removedCount = coll.remove({ _id: { $in: ["id1", "id2"] } });

    expect(removedCount).toBe(2);
    expect(coll.find().count()).toBe(2);
    expect(coll.findOne("id1")).toBeUndefined();
    expect(coll.findOne("id2")).toBeUndefined();
    expect(coll.findOne("id3")).toBeDefined();
    expect(coll.findOne("id4")).toBeDefined();
  });
});

describe("minimongo - unsupported operators", () => {
  it("throws error for $geoIntersects", () => {
    const collection = new LocalCollection<TestDoc>();
    collection.insert({ _id: "a", loc: { type: "Point", coordinates: [0, 0] } });

    const query = {
      loc: {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
          },
        },
      },
    };

    expect(() => collection.findOne(query as any)).toThrow(/Unrecognized operator: \$geoIntersects/);
  });
});