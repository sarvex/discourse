import Controller from "@ember/controller";
import discourseComputed from "discourse-common/utils/decorators";
import { reads } from "@ember/object/computed";
import BulkTopicSelection from "discourse/mixins/bulk-topic-selection";
import { action } from "@ember/object";
import Topic from "discourse/models/topic";

import {
  NEW_FILTER,
  UNREAD_FILTER,
} from "discourse/routes/build-private-messages-route";

// Lists of topics on a user's page.
export default class UserTopicsListController extends Controller.extend(
  BulkTopicSelection
) {
  hideCategory = false;
  showPosters = false;
  channel = null;
  tagsForUser = null;

  @reads("pmTopicTrackingState.newIncoming.length") incomingCount;

  @discourseComputed("model.topics.length", "incomingCount")
  noContent(topicsLength, incomingCount) {
    return topicsLength === 0 && incomingCount === 0;
  }

  @discourseComputed("filter", "model.topics.length")
  showResetNew(filter, hasTopics) {
    return filter === NEW_FILTER && hasTopics;
  }

  @discourseComputed("filter", "model.topics.length")
  showDismissRead(filter, hasTopics) {
    return filter === UNREAD_FILTER && hasTopics;
  }

  subscribe() {
    this.pmTopicTrackingState.trackIncoming(this.inbox, this.filter);
  }

  unsubscribe() {
    this.pmTopicTrackingState.stopIncomingTracking();
  }

  @action
  resetNew() {
    const topicIds = this.selected
      ? this.selected.map((topic) => topic.id)
      : null;

    const opts = {
      inbox: this.inbox,
      topicIds,
    };

    if (this.group) {
      opts.groupName = this.group.name;
    }

    Topic.pmResetNew(opts).then((result) => {
      if (result && result.topic_ids.length > 0) {
        this.pmTopicTrackingState.removeTopics(result.topic_ids);
        this.send("refresh");
      }
    });
  }

  @action
  loadMore() {
    this.model.loadMore();
  }

  @action
  showInserted(event) {
    event?.preventDefault();
    this.model.loadBefore(this.pmTopicTrackingState.newIncoming);
    this.pmTopicTrackingState.resetIncomingTracking();
  }

  @action
  refresh() {
    this.send("triggerRefresh");
  }
}
