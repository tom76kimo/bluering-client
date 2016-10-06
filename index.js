import React from 'react';
import ReactDom from 'react-dom';
import parseOriginContributes from './lib/parseOriginContributes';
import request from 'superagent';

const endPoint = 'https://bluering-server.herokuapp.com/';
const githubAPI = 'https://api.github.com/repos/';

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
  constructor(props) {
    super(props);
    this.state = {
      ...props,
    };
  }
  render() {
    const { title, desc, stars, language } = this.state;
    const [ owner, repo ] = title.split('/');
    return (
        <li className="pinned-repo-item p-3 mb-3 border border-gray-dark rounded-1 js-pinned-repo-list-item public source reorderable">
          <span className="pinned-repo-item-content">
            <span className="d-block">
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
  componentDidMount() {
    const { title, desc, stars, language } = this.state;
    if (stars || stars === 0) {
      return;
    }
    const [ owner, repo ] = title.split('/');
    request
      .get(githubAPI + `${owner}/${repo}`)
      .then(res => {
        return res.body;
      })
      .then(data => {
        this.setState({
          stars: data.stargazers_count,
          language: data.language,
          desc: data.description
        })
      })
      .catch(err => {
        console.log(err)
      });
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    const $userName = document.querySelector('.vcard-username');
    const userName = $userName.innerHTML.trim();
    const contributesList = parseOriginContributes(userName);
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
    if (!!this.state.loading || !this.csrf) {
      return;
    }

    this.setState({
      loading: true,
    });

    const { userName, year, part } = this.state;
    request
      .post(endPoint + 'user/' + userName + '/' + year + '-' + part)
      .send({_csrf: this.csrf})
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

          const { year, part } = this.state;
          const renewedYearPartObject = renewYearPart(year, part);
          let contributesList = [...this.state.contributesList, ...data];
          let contributesListWithTitle = contributesList.map(entry => {
            return entry.title;
          });
          contributesList = contributesList.filter((entry, index) => {
            return contributesListWithTitle.indexOf(entry.title) === index;
          });

          this.setState({
            contributesList,
            ...renewedYearPartObject,
            loading: false,
          })
        }
      })
      .catch(err => {
        console.warn(err);
        this.setState({
          loading: false,
        });
      });
  }

  getCSRF(callback) {
    request
      .get(endPoint + 'token')
      .then((res) => {
        this.csrf = res.text;
        callback && callback();
      });
  }

  componentDidMount() {
    this.getCSRF(() => {
      this.fetchData();
    });
  }
}

let targetContainer = document.querySelector('.js-pinned-repos-reorder-form');
let pinnedRepoList;
if (!targetContainer) {
  targetContainer = document.createElement('div');
  pinnedRepoList = document.querySelector('.pinned-repos-list');
  if (pinnedRepoList) {
    targetContainer.appendChild(pinnedRepoList);
    document.querySelector('.js-pinned-repos-reorder-container').appendChild(targetContainer);
  }
}

if (targetContainer) {
  ReactDom.render(<Main />, targetContainer);
}
