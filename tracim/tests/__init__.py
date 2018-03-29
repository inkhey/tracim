# -*- coding: utf-8 -*-
import unittest
import transaction
from depot.manager import DepotManager
from pyramid import testing

from nose.tools import eq_
from tracim.lib.content import ContentApi
from tracim.lib.workspace import WorkspaceApi
from tracim.models.data import Workspace, ContentType
from tracim.models.data import Content
from tracim.logger import logger
from tracim.fixtures import FixturesLoader
from tracim.fixtures.users_and_groups import Base as BaseFixture
from tracim.config import CFG


class BaseTest(unittest.TestCase):
    """
    Pyramid default test.
    """
    def setUp(self):
        logger.debug(self, 'Setup Test...')
        self.config = testing.setUp(settings={
            'sqlalchemy.url': 'sqlite:///:memory:',
            'user.auth_token.validity': '604800',
            'depot_storage_dir': '/tmp/test/depot',
            'depot_storage_name': 'test',
            'preview_cache_dir': '/tmp/test/preview_cache',

        })
        self.config.include('tracim.models')
        DepotManager._clear()
        DepotManager.configure(
            'test', {'depot.backend': 'depot.io.memory.MemoryFileStorage'}
        )
        settings = self.config.get_settings()

        from tracim.models import (
            get_engine,
            get_session_factory,
            get_tm_session,
            )

        self.engine = get_engine(settings)
        session_factory = get_session_factory(self.engine)

        self.session = get_tm_session(session_factory, transaction.manager)
        self.init_database()

    def init_database(self):
        logger.debug(self, 'Init Database Schema...')
        from tracim.models.meta import DeclarativeBase
        DeclarativeBase.metadata.create_all(self.engine)

    def tearDown(self):
        logger.debug(self, 'TearDown Test...')
        from tracim.models.meta import DeclarativeBase

        testing.tearDown()
        transaction.abort()
        DeclarativeBase.metadata.drop_all(self.engine)


class StandardTest(BaseTest):
    """
    BaseTest with default fixtures
    """
    fixtures = [BaseFixture]

    def init_database(self):
        BaseTest.init_database(self)
        fixtures_loader = FixturesLoader(
            session=self.session,
            config=CFG(self.config.get_settings()))
        fixtures_loader.loads(self.fixtures)


class DefaultTest(StandardTest):

    def _create_workspace_and_test(self, name, user) -> Workspace:
        """
        All extra parameters (*args, **kwargs) are for Workspace init
        :return: Created workspace instance
        """
        WorkspaceApi(
            current_user=user,
            session=self.session,
        ).create_workspace(name, save_now=True)

        eq_(
            1,
            self.session.query(Workspace).filter(
                Workspace.label == name
            ).count()
        )
        return self.session.query(Workspace).filter(
            Workspace.label == name
        ).one()

    def _create_content_and_test(
            self,
            name,
            workspace,
            *args,
            **kwargs
    ) -> Content:
        """
        All extra parameters (*args, **kwargs) are for Content init
        :return: Created Content instance
        """
        content = Content(*args, **kwargs)
        content.label = name
        content.workspace = workspace
        self.session.add(content)
        self.session.flush()

        content_api = ContentApi(
            current_user=None,
            session=self.session,
        )
        eq_(
            1,
            content_api.get_canonical_query().filter(
                Content.label == name
            ).count()
        )
        return content_api.get_canonical_query().filter(
            Content.label == name
        ).one()

    def _create_thread_and_test(self,
                                user,
                                workspace_name='workspace_1',
                                folder_name='folder_1',
                                thread_name='thread_1') -> Content:
        """
        :return: Thread
        """
        workspace = self._create_workspace_and_test(workspace_name, user)
        folder = self._create_content_and_test(
            folder_name, workspace,
            type=ContentType.Folder,
            owner=user
        )
        thread = self._create_content_and_test(
            thread_name,
            workspace,
            type=ContentType.Thread,
            parent=folder,
            owner=user
        )
        return thread
