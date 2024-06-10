import React, { Fragment } from "react";
import ProtobufPart from "./ProtobufPart";
import { Button, Table } from "semantic-ui-react";
import { bufferToPrettyHex } from "./hexUtils";
import { decodeProto, TYPES, typeToString } from "./protobufDecoder";
import {
  decodeFixed32,
  decodeFixed64,
  decodeStringOrBytes,
  decodeVarintParts,
} from "./protobufPartDecoder";

function represent(part) {
  const defaults = {
    field_index: part.index,
    byteRange: part.byteRange,
    // value: part.value,
  };

  if (part.type == TYPES.VARINT) {
    return {
      ...defaults,
      type: "varint",
      data: decodeVarintParts(part.value),
    };
  }

  if (part.type == TYPES.LENDELIM) {
    // TODO: Support repeated field
    let decoded = decodeProto(part.value);
    if (part.value.length > 0 && decoded.leftOver.length === 0) {
      return {
        ...defaults,
        ...represent_parts(decoded),
      };
    }

    return {
      ...defaults,
      ...decodeStringOrBytes(part.value),
    };
  }

  if (part.type == TYPES.FIXED64) {
    return {
      ...defaults,
      data: decodeFixed64(part.value),
      type: "fixed64",
    };
  }

  if (part.type == TYPES.FIXED32) {
    return {
      ...defaults,
      data: decodeFixed32(part.value),
      type: "fixed32",
    };
  }

  return {
    ...defaults,
    error: "Unknown type",
  };
}

const represent_parts = (value) => {
  if (!value.parts) return {};
  const fields = value.parts.map((part) => {
    return represent(part);
  });

  return {
    fields,
  };
};

function ProtobufDisplay(props) {
  const { value } = props;

  const parts = value.parts.map((part, i) => {
    return <ProtobufPart key={i} part={part} />;
  });

  const leftOver = value.leftOver.length
    ? <p>Left over bytes: {bufferToPrettyHex(value.leftOver)}</p>
    : null;

  return (
    <Fragment>
      <Button
        onClick={() => {
          const rawJSON = represent_parts(value);
          console.log(rawJSON);
        }}
      >
        Raw JSON
      </Button>

      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Byte Range</Table.HeaderCell>
            <Table.HeaderCell>Field Number</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>Content</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>{parts}</Table.Body>
      </Table>
      {leftOver}
    </Fragment>
  );
}

export default ProtobufDisplay;
