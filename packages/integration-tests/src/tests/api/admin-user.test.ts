import { HTTPError } from 'got';

import {
  mockSocialConnectorConfig,
  mockSocialConnectorId,
  mockSocialConnectorTarget,
} from '#src/__mocks__/connectors-mock.js';
import {
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  updateUserPassword,
  deleteUserIdentity,
  postConnector,
  updateConnectorConfig,
  deleteConnectorById,
} from '#src/api/index.js';
import { createUserByAdmin } from '#src/helpers/index.js';
import { createNewSocialUserWithUsernameAndPassword } from '#src/helpers/interactions.js';

describe('admin console user management', () => {
  it('should create user successfully', async () => {
    const user = await createUserByAdmin();

    const userDetails = await getUser(user.id);
    expect(userDetails.id).toBe(user.id);
  });

  it('should get user list successfully', async () => {
    await createUserByAdmin();
    const users = await getUsers();

    expect(users.length).not.toBeLessThan(1);
  });

  it('should update userinfo successfully', async () => {
    const user = await createUserByAdmin();

    const newUserData = {
      name: 'new name',
      avatar: 'https://new.avatar.com/avatar.png',
      customData: {
        level: 1,
      },
    };

    const updatedUser = await updateUser(user.id, newUserData);

    expect(updatedUser).toMatchObject(newUserData);
  });

  it('should delete user successfully', async () => {
    const user = await createUserByAdmin();

    const userEntity = await getUser(user.id);
    expect(userEntity).toMatchObject(user);

    await deleteUser(user.id);

    const response = await getUser(user.id).catch((error: unknown) => error);
    expect(response instanceof HTTPError && response.response.statusCode === 404).toBe(true);
  });

  it('should update user password successfully', async () => {
    const user = await createUserByAdmin();
    const userEntity = await updateUserPassword(user.id, 'new_password');
    expect(userEntity).toMatchObject(user);
  });

  it('should delete user identities successfully', async () => {
    // @darcy FIXME: merge post and update
    const { id } = await postConnector({ connectorId: mockSocialConnectorId });
    await updateConnectorConfig(id, mockSocialConnectorConfig);

    const createdUserId = await createNewSocialUserWithUsernameAndPassword(id);

    const userInfo = await getUser(createdUserId);
    expect(userInfo.identities).toHaveProperty(mockSocialConnectorTarget);

    await deleteUserIdentity(createdUserId, mockSocialConnectorTarget);

    const updatedUser = await getUser(createdUserId);

    expect(updatedUser.identities).not.toHaveProperty(mockSocialConnectorTarget);

    await deleteConnectorById(id);
  });
});
