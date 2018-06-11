# -*- coding: utf-8 -*-
import typing

from tracim import CFG
from tracim.models.context_models import UserRoleWorkspaceInContext

__author__ = 'damien'

from sqlalchemy.orm import Session
from sqlalchemy.orm import Query
from tracim.models.auth import User
from tracim.models.data import Workspace
from tracim.models.data import UserRoleInWorkspace
from tracim.models.data import RoleType


class RoleApi(object):

    ALL_ROLE_VALUES = UserRoleInWorkspace.get_all_role_values()
    # Dict containing readable members roles for given role
    members_read_rights = {
        UserRoleInWorkspace.NOT_APPLICABLE: [],
        UserRoleInWorkspace.READER: [
            UserRoleInWorkspace.WORKSPACE_MANAGER,
        ],
        UserRoleInWorkspace.CONTRIBUTOR: [
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            UserRoleInWorkspace.CONTENT_MANAGER,
            UserRoleInWorkspace.CONTRIBUTOR,
        ],
        UserRoleInWorkspace.CONTENT_MANAGER: [
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            UserRoleInWorkspace.CONTENT_MANAGER,
            UserRoleInWorkspace.CONTRIBUTOR,
            UserRoleInWorkspace.READER,
        ],
        UserRoleInWorkspace.WORKSPACE_MANAGER: [
            UserRoleInWorkspace.WORKSPACE_MANAGER,
            UserRoleInWorkspace.CONTENT_MANAGER,
            UserRoleInWorkspace.CONTRIBUTOR,
            UserRoleInWorkspace.READER,
        ],
    }

    def get_user_role_workspace_with_context(
            self,
            user_role: UserRoleInWorkspace
    ) -> UserRoleWorkspaceInContext:
        """
        Return WorkspaceInContext object from Workspace
        """
        workspace = UserRoleWorkspaceInContext(
            user_role=user_role,
            dbsession=self._session,
            config=self._config,
        )
        return workspace

    @classmethod
    def role_can_read_member_role(cls, reader_role: int, tested_role: int) \
            -> bool:
        """
        :param reader_role: role as viewer
        :param tested_role: role as viwed
        :return: True if given role can view member role in workspace.
        """
        if reader_role in cls.members_read_rights:
            return tested_role in cls.members_read_rights[reader_role]
        return False

    @classmethod
    def create_role(cls) -> UserRoleInWorkspace:
        role = UserRoleInWorkspace()

        return role

    def __init__(
        self,
        session: Session,
        current_user: typing.Optional[User],
        config: CFG,
    )-> None:
        self._session = session
        self._user = current_user
        self._config = config

    def _get_one_rsc(self, user_id: int, workspace_id: int) -> Query:
        """
        :param user_id:
        :param workspace_id:
        :return: a Query object, filtered query but without fetching the object.
        """
        return self._session.query(UserRoleInWorkspace).\
            filter(UserRoleInWorkspace.workspace_id == workspace_id).\
            filter(UserRoleInWorkspace.user_id == user_id)

    def get_one(self, user_id: int, workspace_id: int) -> UserRoleInWorkspace:
        return self._get_one_rsc(user_id, workspace_id).one()

    def create_one(
        self,
        user: User,
        workspace: Workspace,
        role_level: int,
        with_notif: bool,
        flush: bool=True
    ) -> UserRoleInWorkspace:
        role = self.create_role()
        role.user_id = user.user_id
        role.workspace = workspace
        role.role = role_level
        role.do_notify = with_notif
        if flush:
            self._session.flush()
        return role

    def delete_one(self, user_id: int, workspace_id: int, flush=True) -> None:
        self._get_one_rsc(user_id, workspace_id).delete()
        if flush:
            self._session.flush()

    def _get_all_for_user(self, user_id) -> typing.List[UserRoleInWorkspace]:
        return self._session.query(UserRoleInWorkspace)\
            .filter(UserRoleInWorkspace.user_id == user_id)

    def get_all_for_user(self, user: User) -> typing.List[UserRoleInWorkspace]:
        return self._get_all_for_user(user.user_id).all()

    def get_all_for_user_order_by_workspace(
        self,
        user_id: int
    ) -> typing.List[UserRoleInWorkspace]:
        return self._get_all_for_user(user_id)\
            .join(UserRoleInWorkspace.workspace).order_by(Workspace.label).all()

    def get_all_for_workspace(
        self,
        workspace:Workspace
    ) -> typing.List[UserRoleInWorkspace]:
        return self._session.query(UserRoleInWorkspace)\
            .filter(UserRoleInWorkspace.workspace_id == workspace.workspace_id).all()  # nopep8

    def save(self, role: UserRoleInWorkspace) -> None:
        self._session.flush()

    # TODO - G.M - 07-06-2018 - [Cleanup] Check if this method is already needed
    @classmethod
    def get_roles_for_select_field(cls) -> typing.List[RoleType]:
        """

        :return: list of DictLikeClass instances representing available Roles
        (to be used in select fields)
        """
        result = list()

        for role_id in UserRoleInWorkspace.get_all_role_values():
            role = RoleType(role_id)
            result.append(role)

        return result
