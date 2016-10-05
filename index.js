import React from 'react';
import ReactDom from 'react-dom';
import parseOriginContributes from './lib/parseOriginContributes';
import request from 'superagent';

const endPoint = 'https://83fc4e22.ngrok.io/user/';

function getLastYearDate() {
  var date = new Date();
  var year = date.getFullYear() - 1;
  var month = date.getMonth() + 1;
  return {
    year: year,
    month: month
  }
}

function verifyParts(year, month) {
  var part = 1;
  year -= 2000;
  if (month < 4) {
    part = 1;
  } else if (month < 7) {
    part = 2;
  } else if (month < 10) {
    part = 3;
  } else {
    part = 4;
  }

  return {
    year: year,
    part: part
  };
}

function renewYearPart(year, part) {
  // if (year <= 0) {
  //   allTaskEnd = true;
  // }
  if (part == 1) {
    return {
      year: year - 1,
      part: 4,
    };
  }

  return {
    year,
    part: part - 1,
  }
}

class RepoItem extends React.Component {
  render() {
    const { title, desc, stars, language } = this.props;
    const [ owner, repo ] = title.split('/');
    return (
        <li className="pinned-repo-item p-3 mb-3 border border-gray-dark rounded-1 js-pinned-repo-list-item public source reorderable">
          <span className="pinned-repo-item-content">
            <span className="d-block">
                <span className="pinned-repository-handle js-pinned-repository-reorder float-left pr-2" title="Drag to reorder">
                  <svg aria-hidden="true" className="octicon octicon-grabber" height="16" version="1.1" viewBox="0 0 8 16" width="8"><path d="M8 4v1H0V4h8zM0 8h8V7H0v1zm0 3h8v-1H0v1z"></path></svg>
                </span>
                <a href="/doublespeakgames/adarkroom" className="text-bold mb-2">
              <span className="owner text-normal" title={owner}>{owner}</span>/<span className="repo js-repo" title={repo}>{repo}</span>
              </a>
            </span>
            <p className="pinned-repo-desc text-gray text-small d-block mt-2 mb-3">{desc}</p>
            <p className="mb-0 f6 text-gray">
              <svg aria-label="stars" className="octicon octicon-star" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg>
              {stars}
              <span className="pinned-repo-language-color" style={{backgroundColor: '#f1e05a'}}></span>
              {language}
            </p>
          </span>
        </li>
    );
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    const contributesList = parseOriginContributes();
    const $userName = document.querySelector('.vcard-username');
    const userName = $userName.innerHTML.trim();
    const lastYearDate = getLastYearDate();
    const yearParts = verifyParts(lastYearDate.year, lastYearDate.month);
    const { year, part } = yearParts;

    this.state = {
      contributesList,
      userName,
      year,
      part,
      loading: false,
    };

    this.fetchData = this.fetchData.bind(this);
  }
  render() {
    const contributesListComponents = this.state.contributesList.map((entry, index) => {
      return <RepoItem {...entry} key={index} />;
    });
    const loadMoreComponent = this.state.loading ? <img src={chrome.extension.getURL('loading.svg')} className="bluering-loading" /> : this.renderLoadMoreComponent();
    return (
      <ol className="pinned-repos-list mb-4 js-pinned-repos-reorder-list">
        {contributesListComponents}
        <div className="bluering-loadmore">
          { loadMoreComponent }
        </div>
      </ol>
    );
  }

  renderLoadMoreComponent() {
    return (
      <div onClick={this.fetchData} className="bluering-loadmore-text">Load More<span className="dropdown-caret"></span></div>
    );
  }

  fetchData() {
    if (!!this.state.loading) {
      return;
    }

    this.setState({
      loading: true,
    });

    const { userName, year, part } = this.state;
    request
      .get(endPoint + userName + '/' + year + '-' + part)
      .type('json')
      .set('Accept', 'application/json')
      .then((res) => {
        return res.body;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          data = data.map((entry) => {
            return {
              title: entry.name,
            };
          });

          const { contributesList, year, part } = this.state;
          const renewedYearPartObject = renewYearPart(year, part);

          this.setState({
            contributesList: [...this.state.contributesList, ...data],
            ...renewedYearPartObject,
            loading: false,
          })
        }
      });
  }

  componentDidMount() {
    this.fetchData();
  }
}

ReactDom.render(<Main />, document.querySelector('.js-pinned-repos-reorder-form'));
