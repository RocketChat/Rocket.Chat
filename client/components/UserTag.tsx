import React, { memo } from "react";
import { Box, Chip } from "@rocket.chat/fuselage";
import { useMutableCallback } from "@rocket.chat/fuselage-hooks";

import UserAvatar from "./avatar/UserAvatar";

interface UserDataProp {
  name: string;
  status: string;
  username: string;
}

function Tag({ userData }: { userData: UserDataProp }) {
  const { username } = userData;
  
  const onClickRemove = useMutableCallback(
    (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();
    }
  );

  return (
    <Chip key={username} height="x20" value={username} onClick={onClickRemove} mie="x4">
      <UserAvatar size="x20" username={username} etag="" />
      <Box is="span" margin="none" mis="x4" value={username}>
        {username}
      </Box>
    </Chip>
  );
}

export default memo(Tag);